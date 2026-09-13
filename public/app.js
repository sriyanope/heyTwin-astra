const form = document.querySelector('#styler-form');
const imageInput = document.querySelector('#image-input');
const dropzone = document.querySelector('#dropzone');
const previewWrap = document.querySelector('#preview-wrap');
const preview = document.querySelector('#preview');
const removePhoto = document.querySelector('#remove-photo');
const detailsPanel = document.querySelector('#details-panel');
const recommendButton = document.querySelector('#recommend-button');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const recommendations = document.querySelector('#recommendations');
const sourceBadge = document.querySelector('#source-badge');
const blocker = document.querySelector('#blocker');
const anotherButton = document.querySelector('#another-button');
let imageDataUrl = '';

const colors = { black: '#30363a', cream: '#e9dfc9', white: '#f9f8f2', olive: '#77816b', blue: '#516e91', red: '#b95348', brown: '#80624b', grey: '#85847e', denim: '#55718c', neutral: '#b7aa96' };

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function showImage(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    setStatus('Choose a JPG, PNG or WebP image.', true);
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    setStatus('That photo is larger than 8 MB. Choose a smaller image.', true);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    imageDataUrl = reader.result;
    preview.src = imageDataUrl;
    previewWrap.hidden = false;
    dropzone.hidden = true;
    detailsPanel.hidden = false;
    results.hidden = true;
    setStatus('Photo ready. Check the details before styling.');
    document.querySelector('#colour').focus();
  };
  reader.readAsDataURL(file);
}

imageInput.addEventListener('change', () => showImage(imageInput.files[0]));
removePhoto.addEventListener('click', () => {
  imageDataUrl = '';
  imageInput.value = '';
  preview.src = '';
  previewWrap.hidden = true;
  dropzone.hidden = false;
  detailsPanel.hidden = true;
  results.hidden = true;
  setStatus('');
});

dropzone.addEventListener('dragover', (event) => { event.preventDefault(); });
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  showImage(event.dataTransfer.files[0]);
});

function safeColor(value) {
  const key = value.toLowerCase().split(/\s+/)[0];
  return colors[key] || colors.neutral;
}

function renderPiece(label, garment, imageUrl = '') {
  const piece = document.createElement('div');
  piece.className = 'piece';
  const labelElement = document.createElement('span');
  labelElement.className = 'piece-label';
  labelElement.textContent = label;
  piece.append(labelElement);
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = `${garment.colour} ${garment.pattern} ${garment.category}`;
    image.onerror = () => image.remove();
    piece.append(image);
  } else {
    const illustration = document.createElement('span');
    illustration.className = `illustration ${garment.category}`;
    illustration.style.setProperty('--piece-color', safeColor(garment.colour));
    illustration.title = 'Illustrative pairing, not a product image';
    piece.append(illustration);
  }
  return piece;
}

function renderRecommendations(data) {
  recommendations.replaceChildren();
  const userGarment = data.garment;
  data.recommendations.forEach((recommendation, index) => {
    const card = document.createElement('article');
    card.className = 'outfit-card';
    const pieces = document.createElement('div');
    pieces.className = 'pieces';
    pieces.append(renderPiece('Your item', userGarment, imageDataUrl));
    pieces.append(renderPiece('Suggested pairing', { ...recommendation, category: userGarment.category === 'top' ? 'bottom' : 'top' }, recommendation.image_url));
    const copy = document.createElement('div');
    copy.className = 'card-copy';
    const title = document.createElement('h3');
    title.textContent = recommendation.category || `Look ${index + 1}`;
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `${recommendation.colour} · ${recommendation.pattern}${recommendation.image_label ? ` · ${recommendation.image_label}` : ''}`;
    const explanation = document.createElement('p');
    explanation.className = 'explanation';
    explanation.textContent = recommendation.explanation;
    copy.append(title, meta, explanation);
    card.append(pieces, copy);
    recommendations.append(card);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!imageDataUrl) {
    setStatus('Add a garment photo first.', true);
    return;
  }
  recommendButton.disabled = true;
  results.hidden = true;
  setStatus('Identifying your garment and building a few combinations…');
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        image_data_url: imageDataUrl,
        garment: {
          category: document.querySelector('#category').value,
          colour: document.querySelector('#colour').value.trim() || 'unknown colour',
          pattern: document.querySelector('#pattern').value.trim() || 'unknown pattern'
        },
        occasion: document.querySelector('#occasion').value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'The recommendation could not be generated.');
    sourceBadge.textContent = data.source_state === 'live' ? 'Live recommendation' : 'Illustrative fallback';
    blocker.textContent = data.blocker || '';
    blocker.hidden = !data.blocker;
    renderRecommendations(data);
    results.hidden = false;
    setStatus(data.source_state === 'live' ? 'Your outfit ideas are ready.' : 'Your illustrative outfit ideas are ready.');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    recommendButton.disabled = false;
  }
});

anotherButton.addEventListener('click', () => {
  removePhoto.click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  imageInput.focus();
});
