import logoImg from "./logo.png";

// If the imported logo is a relative path, resolve it to an absolute URL so it loads in print windows (which have an 'about:blank' origin)
export const LOGO_PATH = typeof logoImg === 'string' && (logoImg.startsWith('/') || !logoImg.includes(':'))
  ? window.location.origin + (logoImg.startsWith('/') ? '' : '/') + logoImg
  : logoImg;

export const PRINT_LOGO_SVG = `
<div class="company-logo-container">
  <img src="${LOGO_PATH}" alt="RHINO CARGO" />
</div>
`;

