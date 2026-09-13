const $ = (s) => document.querySelector(s);
let photo = "",
  garmentId = "",
  revision = 0,
  controller,
  busy = false,
  currentOutfits = [],
  activePairing = "",
  pollTimer,
  modelViewerLoaded = false,
  resultsShown = false,
  pollStartedAt = 0,
  previewBusy = false,
  modelBusy = false,
  previewTrigger,
  cardPollStartedAt = 0;
const cardActions = new Set();
const status = (message = "", error = false) => {
  $("#status").textContent = message;
  $("#status").classList.toggle("error", error);
};
function step(name) {
  for (const id of ["upload", "confirm", "results"]) {
    const item = $(`#step-${id}`);
    id === name
      ? item.setAttribute("aria-current", "step")
      : item.removeAttribute("aria-current");
  }
}
function setBusy(value) {
  busy = value;
  $("#identify-button").disabled = value;
  $("#recommend-button").disabled = value;
  for (const input of $("#details-panel").querySelectorAll(
    "input,select,textarea",
  ))
    input.disabled = value;
  $(".workspace").setAttribute("aria-busy", String(value));
}
async function api(route, payload, signal) {
  const response = await fetch(`/api/${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    // Shopping can follow a failed visual search: allow both bounded server requests.
    signal: signal || AbortSignal.timeout(route === 'find-similar' ? 245000 : 30000),
  });
  const data = await response.json().catch(() => {
    throw new Error("We couldn’t read the response. Please try again.");
  });
  if (!response.ok)
    throw Object.assign(
      new Error(
        data.error?.message || "This action is unavailable. Please try again.",
      ),
      { code: data.error?.code },
    );
  return data;
}
async function pairingState(pairingId) {
  return api("pairing-state", { garment_id: garmentId, pairing_id: pairingId });
}
function stopPolling() {
  clearTimeout(pollTimer);
  pollTimer = undefined;
}
function discard() {
  if (garmentId)
    api("discard-garment", { garment_id: garmentId }).catch(() => {});
  garmentId = "";
}
function reset() {
  revision++;
  controller?.abort();
  stopPolling();
  closePreview();
  discard();
  photo = "";
  currentOutfits = [];
  cardPollStartedAt = 0;
  cardActions.clear();
  resultsShown = false;
  $("#preview").removeAttribute("src");
  $("#preview-wrap").hidden = true;
  $("#dropzone").hidden = false;
  $("#details-panel").hidden = true;
  $("#details-panel").reset();
  $("#empty-panel").hidden = false;
  $("#sample-button").hidden = false;
  $("#results").hidden = true;
  $("#recommendations").replaceChildren();
  $("#identify-button").hidden = true;
  $("#identify-button").textContent = "Identify my piece →";
  $("#image-input").value = "";
  $("#camera-input").value = "";
  setBusy(false);
  step("upload");
  status();
}
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("That photo could not be opened. Try another image."));
    reader.readAsDataURL(file);
  });
}
async function showImage(file) {
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return status(
      "Choose a JPG, PNG or WebP image. For HEIC photos, export or share a JPEG first.",
      true,
    );
  if (file.size > 8 * 1024 * 1024)
    return status(
      "That photo is larger than 8 MB. Choose a smaller image.",
      true,
    );
  const version = ++revision;
  controller?.abort();
  setBusy(false);
  try {
    const data = await readFile(file);
    const image = new Image();
    image.src = data;
    await image.decode().catch(() => {
      throw new Error(
        "That image could not be read. Please choose another photo.",
      );
    });
    if (version !== revision) return;
    reset();
    photo = data;
    $("#preview").src = photo;
    $("#preview-wrap").hidden = false;
    $("#dropzone").hidden = true;
    $("#sample-button").hidden = true;
    $("#identify-button").hidden = false;
    status("Photo ready. Let’s take a look at your piece.");
    $("#identify-button").focus();
  } catch (error) {
    if (version === revision) status(error.message, true);
  }
}
$("#choose-photo").addEventListener("click", () => $("#image-input").click());
$("#take-photo").addEventListener("click", () => $("#camera-input").click());
$("#replace-photo").addEventListener("click", () => {
  $("#image-input").value = "";
  $("#image-input").click();
});
for (const input of ["#image-input", "#camera-input"])
  $(input).addEventListener("change", (event) =>
    showImage(event.target.files[0]),
  );
$("#dropzone").addEventListener("dragover", (event) => event.preventDefault());
$("#dropzone").addEventListener("drop", (event) => {
  event.preventDefault();
  showImage(event.dataTransfer.files[0]);
});
$("#remove-photo").addEventListener("click", () => {
  reset();
  $("#choose-photo").focus();
});
$("#another-button").addEventListener("click", () => {
  reset();
  $("#choose-photo").focus();
});
function showError(error) {
  if (error.name === "AbortError") return;
  if (error.code === "SESSION_EXPIRED") {
    garmentId = "";
    $("#details-panel").hidden = true;
    $("#identify-button").hidden = false;
    step("upload");
  }
  status(
    error.name === "TimeoutError"
      ? "That took too long. Your photo is still here; please try again."
      : error instanceof TypeError
        ? "We couldn’t connect. Check your connection and try again."
        : error.message,
    true,
  );
}
$("#identify-button").addEventListener("click", async () => {
  if (busy || !photo) return;
  const version = revision;
  controller = new AbortController();
  setBusy(true);
  status("Looking at the colour, pattern and shape of your piece…");
  try {
    const result = await api(
      "analyze-garment",
      { image: photo },
      AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]),
    );
    if (version !== revision) return;
    garmentId = result.garment_id;
    for (const key of ["category", "colour", "pattern"])
      $(`#${key}`).value = result.attributes[key].value;
    $("#description").value = result.description;
    $("#confidence-note").textContent =
      result.uncertainty.note ||
      "This is what we see. Make any corrections before styling.";
    $("#identify-button").hidden = true;
    $("#empty-panel").hidden = true;
    $("#details-panel").hidden = false;
    step("confirm");
    status("Your piece is identified. Check the details below.");
    $("#details-title").focus();
  } catch (error) {
    if (version === revision) {
      showError(error);
      $("#identify-button").textContent = "Try identifying again →";
    }
  } finally {
    if (version === revision) setBusy(false);
  }
});
function node(tag, className, content) {
  const element = document.createElement(tag);
  element.className = className;
  if (content) element.textContent = content;
  return element;
}
const isPending = (job) => ["pending", "processing"].includes(job?.status);
const pairingId = (outfit) => outfit.pairing_id || outfit.outfit_id;
const suggested = (outfit) =>
  outfit.items.find((item) => item.ownership === "suggested_item") ||
  outfit.items[1];
const imageState = (outfit) =>
  outfit.image ||
  outfit.generation?.image ||
  (typeof suggested(outfit)?.generation_status === "object"
    ? suggested(outfit).generation_status
    : { status: suggested(outfit)?.generation_status || "idle" });
function jobText(job, noun) {
  if (!job || job.status === "idle") return `Generate ${noun}`;
  if (job.status === "setup_required") return "Image service not configured";
  if (isPending(job)) return `${noun} is generating…`;
  if (job.status === "failed")
    return job.retryable ? `Retry ${noun}` : `${noun} unavailable`;
  return `${noun === 'image' ? 'Image' : noun} ready`;
}
function provenance(job, noun) {
  if (job?.source_state === 'sample') return `${noun} · prepared sample`;
  if (job?.source_state === 'cache') return `${noun} · cached`;
  return `${noun} · AI generated`;
}
function imageFallback(piece, message = "Image unavailable.") {
  piece.classList.add("missing-image");
  piece.replaceChildren(
    node("figcaption", "piece-label", "Suggested pairing"),
    node("span", "missing-image-icon", "◌"),
    node("p", "image-error", message),
  );
}
function render(outfits, sample = false, focusAction) {
  const initialResults = !resultsShown;
  const focused = focusAction || document.activeElement?.dataset;
  currentOutfits = outfits;
  const cards = outfits.map((outfit) => {
    const id = pairingId(outfit),
      suggestion = suggested(outfit),
      card = node("article", "outfit-card"),
      imageJob = imageState(outfit);
    card.dataset.pairingId = id;
    const pieces = node("div", "pieces");
    for (const item of outfit.items) {
      const own = item.ownership === "user_item",
        label = own
          ? sample
            ? "Example item"
            : "Your item"
          : "Suggested pairing",
        piece = node("figure", "piece"),
        src = own
          ? sample
            ? item.image_ref
            : photo
          : imageJob.asset_url ||
            suggestion?.generated_image_ref ||
            (sample ? suggestion?.image_ref : null);
      piece.append(node("figcaption", "piece-label", label));
      if (src) {
        const image = node("img", "garment-image");
        image.src = src;
        image.alt = `${label}: ${item.description || item.category || "garment"}${own && !sample ? "" : ". Illustrative pairing."}`;
        image.addEventListener("error", () => imageFallback(piece));
        piece.append(image);
      } else {
        piece.append(node('p', 'image-placeholder', imageJob.status === 'failed'
          ? imageJob.message || 'The suggested image could not be generated. Choose Retry image.'
          : imageJob.status === 'setup_required' ? 'Image generation needs to be configured.'
          : 'Generating your suggested garment…'));
        piece.setAttribute('aria-busy', String(['idle', 'pending', 'processing'].includes(imageJob.status)));
      }
      if (!own && !sample)
        piece.append(
          node(
            "span",
            `job-badge job-${imageJob.status}`,
            imageJob.status === "succeeded"
              ? provenance(imageJob, 'Image')
              : ({ idle: "Preparing image", pending: "Generating image…", processing: "Generating image…", failed: "Image unavailable", setup_required: "Setup required" }[imageJob.status] || imageJob.status),
          ),
        );
      pieces.append(piece);
    }
    const copy = node("div", "card-copy");
    copy.append(
      node("p", "meta", "Illustrative pairing"),
      node("h3", "", outfit.name),
      node("p", "pairing-description", suggestion?.description || ""),
      node("p", "explanation", outfit.explanation),
    );
    const actions = node("div", "card-actions");
    if (!sample) {
      for (const [action, label] of [
        ["image", jobText(imageJob, "image")],
        [
          "similar",
          outfit.similar?.status === "pending" ? "Finding similar…" : outfit.similar?.status === "failed"
            ? "Retry similar search"
            : "Find similar",
        ],
        ["preview", "Preview outfit"],
      ]) {
        const button = node(
          "button",
          action === "image" ? "small-button primary-small" : "small-button",
          label,
        );
        button.type = "button";
        button.dataset.action = action;
        button.dataset.pairingId = id;
        button.disabled = cardActions.has(`${id}:${action}`) || (action === "image" &&
          (isPending(imageJob) || ['succeeded', 'setup_required'].includes(imageJob.status)));
        actions.append(button);
      }
    }
    copy.append(actions);
    if (imageJob.message) copy.append(node('p', 'feature-message', imageJob.message));
    card.append(pieces, copy);
    if (outfit.similar) card.append(similarPanel(outfit.similar));
    return card;
  });
  $("#recommendations").replaceChildren(...cards);
  $("#source-badge").textContent = sample
    ? "Sample · not live AI"
    : "AI styling";
  $("#result-note").textContent = sample
    ? "A prepared example using illustrations."
    : "heyTwin does not save your original photo. Generated previews may be cached; refreshing means uploading your original photo again.";
  $("#results").hidden = false;
  step("results");
  if (initialResults) {
    resultsShown = true;
    $("#results-title").focus();
  } else if (focused?.action && focused?.pairingId && !$('#outfit-dialog').open) {
    document.querySelector(`[data-action="${focused.action}"][data-pairing-id="${focused.pairingId}"]`)?.focus({ preventScroll: true });
  }
  syncPolling();
}
function similarPanel(similar) {
  const section = node("section", "similar-panel");
  section.setAttribute("aria-label", "Similar pieces");
  section.append(node("h4", "", "Similar pieces"));
  if (similar.query) section.append(node('p', 'similar-query', `Search: ${similar.query}`));
  if (similar.search_basis === 'generated_image') section.append(node('p', 'similar-message', 'Search details checked against the generated garment image.'));
  if (similar.search_note) section.append(node('p', 'similar-message', similar.search_note));
  if (similar.status === 'pending') {
    section.setAttribute('aria-busy', 'true');
    section.append(node('p', 'similar-message', 'Looking for similar pieces… This can take about a minute.'));
    return section;
  }
  section.append(node('p', 'similar-message', similar.source_state === 'sample' ? 'Prepared test listings · not live products.' : 'Similar suggestions, not exact matches. Availability and delivery are unverified.'));
  if (similar.status === "setup_required" || similar.status === "failed") {
    section.append(
      node(
        "p",
        "similar-message",
        similar.message ||
          (similar.status === "failed"
            ? "We couldn’t search for similar pieces. You can retry."
            : "Product search needs setup before it can run."),
      ),
    );
    return section;
  }
  if (similar.message && similar.products?.length)
    section.append(node("p", "similar-message", similar.message));
  const products = Array.isArray(similar.products)
    ? similar.products.slice(0, 6)
    : [];
  if (!products.length) {
    section.append(
      node(
        "p",
        "similar-message",
        "No close matches were found. Generated garments may not have an exact real-world match.",
      ),
    );
    return section;
  }
  const list = node("ul", "product-list");
  for (const product of products) {
    const li = node("li", "product");
    if (product.thumbnail) {
      const img = node("img", "product-thumb");
      img.src = product.thumbnail;
      img.alt = "";
      img.referrerPolicy = 'no-referrer';
      img.addEventListener("error", () =>
        img.replaceWith(node("span", "thumb-fallback", "No image")),
      );
      li.append(img);
    } else li.append(node("span", "thumb-fallback", "No image"));
    const body = node("div", "product-copy"),
      link = node("a", "", product.title || "Product listing");
    link.href = product.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    body.append(
      link,
      node("p", "retailer", product.retailer || "Retailer not provided"),
    );
    if (product.price !== undefined && product.price !== null)
      body.append(
        node(
          "p",
          "price",
          `${product.currency ? `${product.currency} ` : ""}${product.price}`,
        ),
      );
    if (product.match_notes)
      body.append(node("p", "match-notes", `Listing mentions: ${Array.isArray(product.match_notes) ? product.match_notes.join(', ') : product.match_notes}.`));
    li.append(body);
    list.append(li);
  }
  section.append(list);
  return section;
}
async function hydrateStates() {
  if (!garmentId || !currentOutfits.length) return;
  const version = revision,
    snapshot = [...currentOutfits],
    results = await Promise.allSettled(
      snapshot.map((outfit) => pairingState(pairingId(outfit))),
    );
  if (
    version !== revision ||
    snapshot.some((outfit, index) => currentOutfits[index] !== outfit)
  )
    return;
  results.forEach((result, index) => {
    if (result.status === "fulfilled")
      Object.assign(snapshot[index], result.value);
  });
  render(snapshot);
}
function syncPolling() {
  stopPolling();
  if (document.hidden || $("#outfit-dialog").open) return;
  const pending = currentOutfits.some(
      (outfit) =>
        isPending(imageState(outfit)) ||
        isPending(outfit.preview || outfit.generation?.preview) ||
        isPending(outfit.model || outfit.generation?.model),
    );
  if (!pending) { cardPollStartedAt = 0; $('#check-pairing-progress')?.remove(); return; }
  cardPollStartedAt ||= Date.now();
  if (Date.now() - cardPollStartedAt < 600000) pollTimer = setTimeout(() => hydrateStates().catch(() => {}), 5000);
  else if (!$('#check-pairing-progress')) {
    const check = createButton('Check generation progress', () => { cardPollStartedAt = Date.now(); hydrateStates().catch(error => status(error.message, true)); });
    check.id = 'check-pairing-progress';
    $('#results').append(check);
  }
}
$("#details-panel").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !garmentId) return;
  const version = revision,
    attributes = Object.fromEntries(
      ["category", "colour", "pattern", "description"].map((key) => [
        key,
        $(`#${key}`).value.trim(),
      ]),
    ),
    occasion = $("#occasion").value || null;
  controller = new AbortController();
  const signal = AbortSignal.any([
    controller.signal,
    AbortSignal.timeout(55000),
  ]);
  setBusy(true);
  $("#results").hidden = true;
  status("Finding pieces that bring out the best in yours…");
  try {
    await api(
      "confirm-garment",
      { garment_id: garmentId, corrected_attributes: attributes },
      signal,
    );
    const result = await api(
      "recommend-outfits",
      { garment_id: garmentId, confirmed_attributes: attributes, occasion },
      signal,
    );
    if (version !== revision) return;
    render(result.outfits);
    $("#details-panel").hidden = true;
    status("Your pairings are ready.");
    for (const outfit of currentOutfits) {
      if (imageState(outfit).status === 'idle') void generatePairingImage(outfit);
    }
  } catch (error) {
    if (version === revision) showError(error);
  } finally {
    if (version === revision) setBusy(false);
  }
});
function findOutfit(id) {
  return currentOutfits.find((outfit) => pairingId(outfit) === id);
}
async function generatePairingImage(outfit, retry = false) {
  const id = pairingId(outfit), version = revision, actionKey = `${id}:image`;
  if (cardActions.has(actionKey) || isPending(imageState(outfit)) || imageState(outfit).status === 'succeeded') return;
  cardActions.add(actionKey);
  outfit.image = { status: 'pending', source_state: 'live' };
  render(currentOutfits);
  try {
    const result = await api('generate-pairing-image', {
      garment_id: garmentId, pairing_id: id, ...(retry ? { retry: true } : {}),
    });
    if (version === revision && findOutfit(id) === outfit) Object.assign(outfit, result);
  } catch (error) {
    if (version === revision && findOutfit(id) === outfit) {
      outfit.image = { status: 'failed', retryable: true, message: error.message };
    }
  } finally {
    cardActions.delete(actionKey);
    if (version === revision && findOutfit(id) === outfit) render(currentOutfits);
  }
}
$("#recommendations").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const outfit = findOutfit(button.dataset.pairingId),
    id = pairingId(outfit),
    action = button.dataset.action,
    version = revision;
  if (cardActions.has(`${id}:${action}`)) return;
  if (action === 'preview') { await openPreview(outfit, button); return; }
  if (action === 'image') { await generatePairingImage(outfit, imageState(outfit).status === 'failed'); return; }
  cardActions.add(`${id}:${action}`);
  button.setAttribute('aria-busy', 'true');
  try {
    if (action === "similar") {
      const retry = outfit.similar?.status === 'failed';
      outfit.similar = { status: 'pending', query: suggested(outfit)?.description || '' };
      render(currentOutfits);
      outfit.similar = await api("find-similar", {
        garment_id: garmentId,
        pairing_id: id,
        ...(retry ? { retry: true } : {}),
      });
      if (version === revision) { cardActions.delete(`${id}:${action}`); render(currentOutfits, false, { pairingId: id, action }); }
    }
  } catch (error) {
    if (version === revision) {
      outfit.similar = { status: 'failed', query: suggested(outfit)?.description || '', message: error.message };
      cardActions.delete(`${id}:${action}`);
      render(currentOutfits, false, { pairingId: id, action });
    }
  } finally {
    cardActions.delete(`${id}:${action}`);
    button.removeAttribute('aria-busy');
    if (version === revision && document.body.contains(button))
      button.disabled = false;
  }
});
function activeOutfit() {
  return findOutfit(activePairing);
}
function clearDialog() {
  $("#preview-image-wrap").replaceChildren(
    node(
      "p",
      "preview-empty",
      "Choose “Preview outfit” to create a neutral mannequin preview.",
    ),
  );
  $("#preview-controls").replaceChildren();
  $("#model-wrap").replaceChildren(
    node("p", "", "Choose a 2D preview or explore the outfit in 3D."),
  );
  $("#model-controls").replaceChildren();
  $("#model-status").textContent = "Ready when you are";
}
async function openPreview(outfit, trigger) {
  stopPolling();
  activePairing = pairingId(outfit);
  pollStartedAt = Date.now();
  previewTrigger = trigger;
  $('#dialog-status').textContent = '';
  $("#outfit-dialog-title").textContent =
    outfit.name || "See the pairing together";
  $("#preview-provenance").textContent =
    "Your original photo is sent again only when you explicitly create this preview. Generated previews and models may be cached.";
  clearDialog();
  $("#outfit-dialog").showModal();
  renderPreview(outfit);
  await refreshPreview();
}
function closePreview() {
  stopPolling();
  if ($("#outfit-dialog").open) $("#outfit-dialog").close();
}
$("#close-preview").addEventListener("click", closePreview);
$("#outfit-dialog").addEventListener("close", () => {
  stopPolling();
  const id = activePairing;
  activePairing = "";
  const trigger = document.querySelector(`[data-action="preview"][data-pairing-id="${id}"]`) || previewTrigger;
  trigger?.focus();
  previewTrigger = undefined;
  syncPolling();
});
function createButton(label, action) {
  const button = node("button", "small-button primary-small", label);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}
function renderPreview(outfit) {
  if (!outfit || pairingId(outfit) !== activePairing) return;
  const preview = outfit.preview ||
      outfit.generation?.preview || { status: "idle" },
    model = outfit.model || outfit.generation?.model || { status: "idle" },
    imageBox = $("#preview-image-wrap"),
    controls = $("#preview-controls");
  controls.replaceChildren();
  if (preview.status === 'succeeded') controls.append(node('p', 'meta', provenance(preview, '2D preview')));
  if (preview.status === "succeeded" && preview.asset_url) {
    const image = node("img", "outfit-preview-image");
    image.src = preview.asset_url;
    image.alt = `Generated neutral mannequin wearing your item with ${suggested(outfit)?.description || "the suggested item"}`;
    image.addEventListener("error", () => {
      imageBox.replaceChildren(
        node(
          "p",
          "preview-empty",
          "The generated preview could not load. You can retry it.",
        ),
      );
      controls.append(createButton('Reload preview image', () => renderPreview(outfit)));
    });
    imageBox.replaceChildren(image);
  } else
    imageBox.replaceChildren(
      node(
        "p",
        "preview-empty",
        preview.message ||
          (isPending(preview)
            ? "Creating your 2D outfit preview…"
            : "Create a neutral mannequin preview for this pairing."),
      ),
    );
  if (preview.status !== "succeeded") {
    const retry = preview.status === "failed",
      button = createButton(
        retry ? "Retry 2D preview" : jobText(preview, "2D preview"),
        () => generatePreview(retry),
      );
    button.disabled =
      previewBusy || isPending(preview) || preview.status === "setup_required";
    controls.append(button);
  }
  renderModel(outfit, model);
  if (isPending(preview) || isPending(model)) schedulePreviewPoll();
}
async function generatePreview(retry) {
  const outfit = activeOutfit(),
    version = revision,
    id = activePairing;
  if (!outfit || !photo || previewBusy) return;
  $('#dialog-status').textContent = '';
  previewBusy = true;
  renderPreview(outfit);
  try {
    Object.assign(
      outfit,
      await api("preview-outfit", {
        garment_id: garmentId,
        pairing_id: id,
        image: photo,
        ...(retry ? { retry: true } : {}),
      }),
    );
    if (version === revision && id === activePairing) renderPreview(outfit);
  } catch (error) {
    if (version === revision && id === activePairing) $("#dialog-status").textContent = error.message;
  } finally {
    previewBusy = false;
    if (version === revision && id === activePairing) renderPreview(outfit);
  }
}
function renderModel(outfit, model) {
  const wrap = $("#model-wrap"),
    controls = $("#model-controls"),
    preview = outfit.preview || outfit.generation?.preview || {};
  const simple = model.method === 'openai-parametric';
  $('.model-note').textContent = simple
    ? 'A simplified 3D sketch from your confirmed garment details. Patterns and fine details are simplified; this does not predict fit.'
    : 'A generated mannequin approximation. Fit and details that are not visible in your photo may differ.';
  controls.replaceChildren();
  $("#model-status").textContent =
    model.status === "succeeded"
      ? provenance(model, simple ? 'Simplified 3D' : '3D asset')
      : model.status.replace("_", " ");
  if (model.status === "succeeded" && model.asset_url) {
    const existing = wrap.querySelector('model-viewer');
    const viewer = existing?.getAttribute('src') === model.asset_url ? existing : document.createElement("model-viewer");
    viewer.setAttribute('src', model.asset_url);
    viewer.alt = `Interactive 3D generated mannequin wearing ${suggested(outfit)?.description || "the selected pairing"}`;
    viewer.setAttribute("camera-controls", "");
    viewer.setAttribute("touch-action", "pan-y");
    viewer.setAttribute("interaction-prompt", "auto");
    viewer.setAttribute("shadow-intensity", "1");
    viewer.setAttribute("camera-orbit", "0deg 75deg 105%");
    viewer.addEventListener("error", () => {
      wrap.replaceChildren(
        node(
          "p",
          "",
          preview.status === 'succeeded' ? "The 3D view could not load. Your 2D preview is still available." : 'The 3D view could not load. Please reload it.',
        ),
      );
      controls.replaceChildren(createButton('Reload 3D view', () => renderModel(outfit, model)));
    });
    if (viewer !== existing) wrap.replaceChildren(viewer);
    controls.append(
      createButton("Reset view", () => {
        viewer.cameraOrbit = "0deg 75deg 105%";
        viewer.fieldOfView = "auto";
      }),
    );
    return;
  }
  wrap.replaceChildren(
    node(
      "p",
      "",
      model.message ||
        (isPending(model)
          ? "Creating a rotatable 3D mannequin…"
          : simple ? 'Explore a simplified outfit in 3D using your confirmed garment details.' : "A 3D version is available after your 2D preview is ready."),
    ),
  );
  if (simple || preview.status === "succeeded") {
    const retry = model.status === "failed",
      button = createButton(
        retry ? "Retry Explore in 3D" : "Explore in 3D",
        () => generateModel(retry),
      );
    button.disabled =
      modelBusy || isPending(model) || model.status === "setup_required";
    controls.append(button);
  }
}
async function generateModel(retry) {
  const outfit = activeOutfit(),
    version = revision,
    id = activePairing;
  if (!outfit || modelBusy) return;
  $('#dialog-status').textContent = '';
  modelBusy = true;
  renderPreview(outfit);
  try {
    await ensureModelViewer();
    Object.assign(
      outfit,
      await api("generate-outfit-model", {
        garment_id: garmentId,
        pairing_id: id,
        ...(retry ? { retry: true } : {}),
      }),
    );
    if (version === revision && id === activePairing) renderPreview(outfit);
  } catch (error) {
    if (version === revision && id === activePairing) $("#dialog-status").textContent = error.message;
  } finally {
    modelBusy = false;
    if (version === revision && id === activePairing) renderPreview(outfit);
  }
}
async function ensureModelViewer() {
  if (modelViewerLoaded || customElements.get("model-viewer")) return;
  await import("/vendor/model-viewer.min.js");
  modelViewerLoaded = true;
}
function schedulePreviewPoll() {
  stopPolling();
  if (
    !document.hidden &&
    $("#outfit-dialog").open &&
    Date.now() - pollStartedAt < 600000
  )
    pollTimer = setTimeout(refreshPreview, 5000);
  else if ($("#outfit-dialog").open) {
    $("#dialog-status").textContent =
      "Generation is still running. Choose Check status when you are ready.";
    const check = createButton("Check status", refreshPreview);
    $("#model-controls").append(check);
  }
}
async function refreshPreview() {
  const id = activePairing,
    version = revision;
  if (!id || document.hidden || !$("#outfit-dialog").open) return;
  try {
    const result = await pairingState(id),
      outfit = activeOutfit();
    if (!outfit || version !== revision || id !== activePairing) return;
    Object.assign(outfit, result);
    if ((outfit.model || outfit.generation?.model)?.status === "succeeded")
      ensureModelViewer().catch(() => {
        $("#model-wrap").replaceChildren(
          node(
            "p",
            "",
            "The 3D viewer could not load. Please reopen the outfit preview to retry.",
          ),
        );
      });
    renderPreview(outfit);
  } catch (error) {
    if (version === revision && id === activePairing) $("#dialog-status").textContent = error.message;
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPolling();
  else if ($("#outfit-dialog").open) refreshPreview();
  else syncPolling();
});
$("#sample-button").addEventListener("click", () => {
  render(
    [
      {
        pairing_id: "sample-cream-trousers",
        name: "A softer kind of everyday",
        explanation:
          "Cream trousers bring a warm contrast to the light blue shirt, while the relaxed shapes keep the combination easygoing.",
        items: [
          {
            ownership: "user_item",
            description: "Light blue collared shirt",
            image_ref: "/catalogue/blue-shirt.svg",
          },
          {
            ownership: "suggested_item",
            description: "Cream wide-leg trousers",
            image_ref: "/catalogue/cream-trousers.svg",
          },
        ],
      },
    ],
    true,
  );
  status("Showing a prepared sample, not a live recommendation.");
});
