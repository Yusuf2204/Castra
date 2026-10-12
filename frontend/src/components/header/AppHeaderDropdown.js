import React from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilAccountLogout, cilLockLocked } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import CIcon from '@coreui/icons-react'
import api from '../../services/api'
import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.user)

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } catch (e) {
      // token mungkin sudah expired — tetap lanjut logout
    } finally {
      localStorage.removeItem('token')
      navigate('/login')
    }
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>

      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">
          {user?.name || 'Akun Saya'}
        </CDropdownHeader>

        <CDropdownItem
          onClick={() => navigate('/setup/change-password')}
          style={{ cursor: 'pointer' }}
        >
          <CIcon icon={cilLockLocked} className="me-2" />
          Ubah Password
        </CDropdownItem>

        <CDropdownDivider />

        <CDropdownItem onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <CIcon icon={cilAccountLogout} className="me-2 text-danger" />
          <span className="text-danger">Logout</span>
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
