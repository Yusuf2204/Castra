import React, { useEffect, useState } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import MenusTable from './MenusTable'
import MenusForm from './MenusForm'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'

const Menus = () => {
  const [menus, setMenus] = useState([])
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMenus = async () => {
    setLoading(true)
    try {
      const res = await api.get('/menus')
      setMenus(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  const handleSaved = () => {
    setSelectedMenu(null)
    fetchMenus()
  }

  const handleAskDelete = (id) => {
    setDeleteId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/menus/${deleteId}`)
      toastSuccess('Menu deleted')
      fetchMenus()
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <CRow>
      <CCol md={7}>
        <CCard>
          <CCardHeader className="d-flex justify-content-between">
            Menu List
            <CButton size="sm" color="secondary" onClick={fetchMenus}>
              <CIcon icon={cilReload} />
            </CButton>
          </CCardHeader>
          <CCardBody>
            <MenusTable
              menus={menus}
              loading={loading}
              onSelect={setSelectedMenu}
              onDelete={handleAskDelete}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={5}>
        <CCard>
          <CCardHeader>{selectedMenu ? 'Edit Menu' : 'Add Menu'}</CCardHeader>
          <CCardBody>
            <MenusForm
              menu={selectedMenu}
              onReset={() => setSelectedMenu(null)}
              onSaved={handleSaved}
              menus={menus}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>

        <CModalBody>Are you sure you want to delete this menu?</CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Menus
