export default function Modal({ title, visible, onClose, children }) {
  if (!visible) return null;

  return (
    <div className="custom-modal-backdrop">
      <div className="custom-modal-dialog shadow-lg">
        <div className="custom-modal-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">{title}</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <div className="custom-modal-body">{children}</div>
      </div>
    </div>
  );
}
