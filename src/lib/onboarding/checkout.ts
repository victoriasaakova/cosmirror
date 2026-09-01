const PAY_WINDOW_NAME = "cosmirror-prodamus";

export function checkoutUsesNewTab() {
  return !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function openPayWindow(): Window | null {
  if (!checkoutUsesNewTab()) return null;
  if (window.name === PAY_WINDOW_NAME) window.name = "";
  const child = window.open("", PAY_WINDOW_NAME);
  if (!child || child === window) return null;
  try {
    child.document.open();
    child.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Cosmirror</title>
<style>html,body{height:100%;margin:0;background:#050d4a;color:#fff;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}</style>
</head><body><p>открываем оплату…</p></body></html>`);
    child.document.close();
  } catch {
    /* ignore */
  }
  return child;
}

export function goToPayment(url: string, payWindow: Window | null) {
  if (payWindow && !payWindow.closed) {
    payWindow.location.replace(url);
    window.location.assign("/account/");
    return;
  }
  window.location.assign(url);
}
