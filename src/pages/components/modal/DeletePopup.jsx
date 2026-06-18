import AdminConfirmDialog from 'src/components/admin/AdminConfirmDialog'

export default function DeletePopup({ handleClose, open, onConform, isLoading = false }) {
  return (
    <AdminConfirmDialog
      open={open}
      onClose={handleClose}
      onConfirm={onConform}
      title='Delete this item?'
      message='This action cannot be undone. The record will be removed permanently.'
      confirmLabel={isLoading ? 'Deleting…' : 'Delete'}
      cancelLabel='Cancel'
      variant='danger'
      loading={isLoading}
    />
  )
}
