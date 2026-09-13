const $ = selector => document.querySelector(selector);
let photo = '';
let garmentId = '';
let revision = 0;
let controller;
let busy = false;

function status(message = '', error = false) {
  $('#status').textContent = message;
  $('#status').classList.toggle('error', error);
}
function step(name) {
  for (const id of ['upload', 'confirm', 'results']) {
    const item = $(`#step-${id}`);
    if (id === name) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
}
function setBusy(value) {
  busy = value;
  $('#identify-button').disabled = value;
  $('#recommend-button').disabled = value;
  for (const input of $('#details-panel').querySelectorAll('input, select, textarea')) input.disabled = value;
  $('.workspace').setAttribute('aria-busy', String(value));
}
async function api(route, payload, signal) {
  const response = await fetch(`/api/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal });
  const data = await response.json().catch(() => { throw new Error('We couldn’t read the response. Please try again.'); });
  if (!response.ok) throw Object.assign(new Error(data.error?.message || 'Styling is unavailable. Please try again.'), { code: data.error?.code });
  return data;
}
function discard() {
  if (garmentId) api('discard-garment', { garment_id: garmentId }).catch(() => {});
  garmentId = '';
}
function reset() {
  revision++;
  controller?.abort();
  discard();
  photo = '';
  $('#preview').removeAttribute('src');
  $('#preview-wrap').hidden = true;
  $('#dropzone').hidden = false;
  $('#details-panel').hidden = true;
  $('#details-panel').reset();
  $('#empty-panel').hidden = false;
  $('#sample-button').hidden = false;
  $('#results').hidden = true;
  $('#recommendations').replaceChildren();
  $('#identify-button').hidden = true;
  $('#identify-button').textContent = 'Identify my piece →';
  $('#image-input').value = '';
  $('#camera-input').value = '';
  setBusy(false);
  step('upload');
  status();
}
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('That photo could not be opened. Try another image.'));
    reader.readAsDataURL(file);
  });
}
async function showImage(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return status('Choose a JPG, PNG or WebP image. For HEIC photos, export or share a JPEG first.', true);
  if (file.size > 8 * 1024 * 1024) return status('That photo is larger than 8 MB. Choose a smaller image.', true);
  const version = ++revision;
  controller?.abort();
  setBusy(false);
  try {
    const data = await readFile(file);
    const image = new Image();
    image.src = data;
    await image.decode().catch(() => { throw new Error('That image could not be read. Please choose another photo.'); });
    if (version !== revision) return;
    reset();
    photo = data;
    $('#preview').src = photo;
    $('#preview-wrap').hidden = false;
    $('#dropzone').hidden = true;
    $('#sample-button').hidden = true;
    $('#identify-button').hidden = false;
    status('Photo ready. Let’s take a look at your piece.');
    $('#identify-button').focus();
  } catch (error) { if (version === revision) status(error.message, true); }
}
$('#choose-photo').addEventListener('click', () => $('#image-input').click());
$('#take-photo').addEventListener('click', () => $('#camera-input').click());
$('#replace-photo').addEventListener('click', () => { $('#image-input').value = ''; $('#image-input').click(); });
for (const input of ['#image-input', '#camera-input']) $(input).addEventListener('change', event => showImage(event.target.files[0]));
$('#dropzone').addEventListener('dragover', event => event.preventDefault());
$('#dropzone').addEventListener('drop', event => { event.preventDefault(); showImage(event.dataTransfer.files[0]); });
$('#remove-photo').addEventListener('click', () => { reset(); $('#choose-photo').focus(); });
$('#another-button').addEventListener('click', () => { reset(); $('#choose-photo').focus(); });

function showError(error) {
  if (error.name === 'AbortError') return;
  if (error.code === 'SESSION_EXPIRED') {
    garmentId = '';
    $('#details-panel').hidden = true;
    $('#identify-button').hidden = false;
    step('upload');
  }
  status(error.name === 'TimeoutError' ? 'That took too long. Your photo is still here; please try again.' : error instanceof TypeError ? 'We couldn’t connect. Check your connection and try again.' : error.message, true);
}
$('#identify-button').addEventListener('click', async () => {
  if (busy || !photo) return;
  const version = revision;
  controller = new AbortController();
  setBusy(true);
  status('Looking at the colour, pattern and shape of your piece…');
  try {
    const result = await api('analyze-garment', { image: photo }, AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]));
    if (version !== revision) return;
    garmentId = result.garment_id;
    for (const key of ['category', 'colour', 'pattern']) $(`#${key}`).value = result.attributes[key].value;
    $('#description').value = result.description;
    $('#confidence-note').textContent = result.uncertainty.note || 'This is what we see. Make any corrections before styling.';
    $('#identify-button').hidden = true;
    $('#empty-panel').hidden = true;
    $('#details-panel').hidden = false;
    step('confirm');
    status('Your piece is identified. Check the details below.');
    $('#details-title').focus();
  } catch (error) {
    if (version === revision) { showError(error); $('#identify-button').textContent = 'Try identifying again →'; }
  } finally { if (version === revision) setBusy(false); }
});

function node(tag, className, content) {
  const element = document.createElement(tag);
  element.className = className;
  if (content) element.textContent = content;
  return element;
}
function render(outfits, sample = false) {
  const cards = outfits.map(outfit => {
    const card = node('article', 'outfit-card');
    const pieces = node('div', 'pieces');
    for (const item of outfit.items) {
      const own = item.ownership === 'user_item';
      const label = own ? (sample ? 'Example item' : 'Your item') : 'Suggested pairing';
      const piece = node('figure', 'piece');
      const image = node('img', 'garment-image');
      image.src = own && !sample ? photo : item.image_ref;
      image.alt = `${label}: ${item.description}${own && !sample ? '' : ' (illustration)'}`;
      image.addEventListener('error', () => {
        image.hidden = true;
        piece.append(node('p', 'image-error', 'Image unavailable. Please try again.'));
        status('A pairing image could not load. Please retry to see the complete outfit.', true);
      });
      piece.append(node('figcaption', 'piece-label', label), image);
      pieces.append(piece);
    }
    const copy = node('div', 'card-copy');
    copy.append(node('p', 'meta', 'Illustrative pairing'), node('h3', '', outfit.name), node('p', 'pairing-description', outfit.items[1].description), node('p', 'explanation', outfit.explanation));
    card.append(pieces, copy);
    return card;
  });
  $('#recommendations').replaceChildren(...cards);
  $('#source-badge').textContent = sample ? 'Sample · not live AI' : 'AI styling';
  $('#result-note').textContent = sample ? 'A prepared example using illustrations. Your own upload will be styled separately.' : 'Your original photo, paired with illustrative suggestions. You may already have something similar.';
  $('#results').hidden = false;
  step('results');
  $('#results-title').focus();
}
$('#details-panel').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !garmentId) return;
  const version = revision;
  const attributes = Object.fromEntries(['category', 'colour', 'pattern', 'description'].map(key => [key, $(`#${key}`).value.trim()]));
  const occasion = $('#occasion').value || null;
  controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]);
  setBusy(true);
  $('#results').hidden = true;
  status('Finding pieces that bring out the best in yours…');
  try {
    await api('confirm-garment', { garment_id: garmentId, corrected_attributes: attributes }, signal);
    const result = await api('recommend-outfits', { garment_id: garmentId, confirmed_attributes: attributes, occasion }, signal);
    if (version !== revision) return;
    render(result.outfits);
    $('#details-panel').hidden = true;
    status('Your pairings are ready.');
  } catch (error) { if (version === revision) showError(error); }
  finally { if (version === revision) setBusy(false); }
});
$('#sample-button').addEventListener('click', () => {
  render([{ name: 'A softer kind of everyday', explanation: 'Cream trousers bring a warm contrast to the light blue shirt, while the relaxed shapes keep the combination easygoing.', items: [
    { ownership: 'user_item', description: 'Light blue collared shirt', image_ref: '/catalogue/blue-shirt.svg' },
    { ownership: 'suggested_item', description: 'Cream wide-leg trousers', image_ref: '/catalogue/cream-trousers.svg' }
  ] }], true);
  status('Showing a prepared sample, not a live recommendation.');
});
