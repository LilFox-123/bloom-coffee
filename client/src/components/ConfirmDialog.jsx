import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc muốn xóa? Hành động này không thể hoàn tác.',
  confirmLabel = 'Xóa',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-text-muted mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>
          Hủy
        </button>
        <button
          className="btn-danger"
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
