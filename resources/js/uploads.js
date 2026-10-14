// Native file inputs remain keyboard/screen-reader accessible inside styled labels.
export function renderUploadField({ name, title, accept, hint, icon }) {
    return `<div class="upload-field" data-upload="${name}">
        <span class="field-label" id="upload-${name}-label">${title}</span>
        <label class="upload-control">
            <input type="file" name="${name}" accept="${accept}" aria-labelledby="upload-${name}-label" aria-describedby="upload-${name}-hint" class="upload-input">
            <span class="upload-glyph" aria-hidden="true">${icon}</span>
            <span class="upload-copy"><strong data-upload-prompt>Choose a file</strong><small id="upload-${name}-hint">${hint}</small></span>
            <span class="upload-browse" aria-hidden="true">Browse</span>
        </label>
        <div class="upload-selection" hidden><span data-upload-name role="status"></span><button type="button" data-action="clear-upload" aria-label="Remove selected ${name}">Remove</button></div>
    </div>`;
}

export function syncUpload(input) {
    const wrapper = input.closest('[data-upload]');
    if (!wrapper) return;
    const file = input.files?.[0];
    wrapper.classList.toggle('has-file', Boolean(file));
    wrapper.querySelector('.upload-selection').hidden = !file;
    wrapper.querySelector('[data-upload-prompt]').textContent = file ? 'Change file' : 'Choose a file';
    wrapper.querySelector('[data-upload-name]').textContent = file ? `${file.name} · ${file.size >= 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`}` : '';
}

export function validateUpload(file, name, apiEnabled) {
    if (!file) return '';
    const rasterTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const svg = name === 'logo' && (file.type === 'image/svg+xml' || (!file.type && /\.svg$/i.test(file.name)));
    if (!rasterTypes.includes(file.type) && !svg) return `Choose a PNG, JPEG, or WebP${name === 'logo' ? ' or SVG logo' : ''}.`;
    const limit = apiEnabled ? (name === 'logo' ? 2 : 5) * 1024 * 1024 : 1200000;
    if (file.size > limit) return `Choose a file under ${apiEnabled ? (name === 'logo' ? '2 MB' : '5 MB') : '1.2 MB for this preview'}.`;
    if (svg && !apiEnabled) return 'SVG logos are supported on the live site. Use PNG, JPEG, or WebP in this browser preview.';
    return '';
}
