export type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

let activeDialogCleanup: (() => void) | null = null;

const ICONS: Record<DialogType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: '💬',
  confirm: '❓',
};

const TITLES: Record<DialogType, string> = {
  success: 'Ação concluída',
  error: 'Não foi possível concluir',
  warning: 'Atenção',
  info: 'Informação',
  confirm: 'Confirme a ação',
};

function inferType(message: string): DialogType {
  const value = message.toLowerCase();
  if (/erro|falha|não foi|nao foi|insuficiente|inválid|invalido/.test(value)) return 'error';
  if (/sucesso|parabéns|parabens|salv|criad|compr|ativad|adicionado|alterado/.test(value)) return 'success';
  if (/atenção|atencao|sem vidas|preencha|selecione|por favor/.test(value)) return 'warning';
  return 'info';
}

function showDialog(options: DialogOptions): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(true);

  activeDialogCleanup?.();

  const type = options.type ?? inferType(options.message);
  const overlay = document.createElement('div');
  overlay.className = 'falla-dialog-overlay';
  overlay.setAttribute('role', 'presentation');

  const dialog = document.createElement('section');
  dialog.className = `falla-dialog falla-dialog--${type}`;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'falla-dialog-title');

  const icon = document.createElement('div');
  icon.className = 'falla-dialog__icon';
  icon.textContent = ICONS[type];

  const title = document.createElement('h2');
  title.id = 'falla-dialog-title';
  title.className = 'falla-dialog__title';
  title.textContent = options.title ?? TITLES[type];

  const message = document.createElement('p');
  message.className = 'falla-dialog__message';
  message.textContent = options.message;

  const actions = document.createElement('div');
  actions.className = 'falla-dialog__actions';

  const confirmButton = document.createElement('button');
  confirmButton.type = 'button';
  confirmButton.className = 'falla-dialog__button falla-dialog__button--confirm';
  confirmButton.textContent = options.confirmText ?? 'Continuar';

  let cancelButton: HTMLButtonElement | null = null;
  if (options.showCancel) {
    cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'falla-dialog__button falla-dialog__button--cancel';
    cancelButton.textContent = options.cancelText ?? 'Cancelar';
    actions.appendChild(cancelButton);
  }
  actions.appendChild(confirmButton);

  dialog.append(icon, title, message, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  document.body.classList.add('falla-dialog-open');

  return new Promise<boolean>((resolve) => {
    let finished = false;

    const finish = (result: boolean) => {
      if (finished) return;
      finished = true;
      document.removeEventListener('keydown', onKeyDown);
      overlay.classList.add('falla-dialog-overlay--closing');
      window.setTimeout(() => {
        overlay.remove();
        document.body.classList.remove('falla-dialog-open');
      }, 160);
      activeDialogCleanup = null;
      resolve(result);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && options.showCancel) finish(false);
      if (event.key === 'Enter') finish(true);
    };

    activeDialogCleanup = () => finish(false);
    confirmButton.addEventListener('click', () => finish(true));
    cancelButton?.addEventListener('click', () => finish(false));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay && options.showCancel) finish(false);
    });
    document.addEventListener('keydown', onKeyDown);

    window.requestAnimationFrame(() => {
      overlay.classList.add('falla-dialog-overlay--visible');
      confirmButton.focus();
    });
  });
}

export function themedAlert(
  message: string,
  options: Omit<DialogOptions, 'message' | 'showCancel'> = {},
): Promise<boolean> {
  return showDialog({ ...options, message, showCancel: false });
}

export function themedConfirm(
  message: string,
  options: Omit<DialogOptions, 'message' | 'showCancel' | 'type'> = {},
): Promise<boolean> {
  return showDialog({
    ...options,
    message,
    type: 'confirm',
    showCancel: true,
    confirmText: options.confirmText ?? 'Confirmar',
  });
}
