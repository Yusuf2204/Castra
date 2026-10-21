import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'

import { AppSidebarNav } from './AppSidebarNav'
import { buildSidebarNavigation } from '../services/sidebarService'
import defaultLogo from '../assets/images/logos/castra_logo_white.svg'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const company = useSelector((state) => state.company)
  const navigationTree = useSelector((state) => state.navigation)
  const navigation = useMemo(() => buildSidebarNavigation(navigationTree), [navigationTree])

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/" className="fw-bold text-white py-2">
          {company?.comp_logo ? (
            <img
              src={company.comp_logo}
              alt={company?.comp_name || 'Castra'}
              height="36"
              style={{ objectFit: 'contain', maxWidth: '100%' }}
            />
          ) : (
            <img
              src={defaultLogo}
              alt="Castra"
              height="36"
              style={{ objectFit: 'contain', maxWidth: '100%' }}
            />
          )}
        </CSidebarBrand>

        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>

      <AppSidebarNav items={navigation} />

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
