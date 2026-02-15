export default window.ReactDOM;
// Safe destructuring with fallback to prevent undefined errors if keys miss
const RD = window.ReactDOM || {};
export const createRoot = RD.createRoot;
export const hydrateRoot = RD.hydrateRoot;
export const findDOMNode = RD.findDOMNode;
export const createPortal = RD.createPortal;
export const unmountComponentAtNode = RD.unmountComponentAtNode;
export const flushSync = RD.flushSync;
export const render = RD.render;
export const hydrate = RD.hydrate;
