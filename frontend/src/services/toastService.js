export const showToast = ({ color = 'success', title = 'Notification', message = '' }) => {
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: { color, title, message },
    }),
  )
}

export const toastSuccess = (message, title = 'Success') => {
  showToast({ color: 'success', title, message })
}

export const toastError = (message, title = 'Error') => {
  showToast({ color: 'danger', title, message })
}
