import { Permission } from '@longpoint/types';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '../layouts/auth-layout';
import { DashboardLayout } from '../layouts/dashboard-layout';
import { SignIn } from '../pages/auth/sign-in';
import { SignUp } from '../pages/auth/sign-up';
import { Assets } from '../pages/dashboard/assets';
import { Classifiers } from '../pages/dashboard/classifiers';
import { CreateClassifier } from '../pages/dashboard/classifiers/create';
import { ClassifierDetail } from '../pages/dashboard/classifiers/detail';
import { Collections } from '../pages/dashboard/collections';
import { CollectionDetail } from '../pages/dashboard/collections/detail';
import { DashboardHome } from '../pages/dashboard/home';
import { AssetDetail } from '../pages/dashboard/media-detail';
import { SearchResults } from '../pages/dashboard/search-results';
import { PluginDetails } from '../pages/dashboard/settings/plugins/plugin-details';
import { Settings } from '../pages/dashboard/settings/settings';
import { StorageProviderConfigDetail } from '../pages/dashboard/settings/storage-settings/storage-provider-config-detail';
import { UsersAndRoles } from '../pages/dashboard/users/users-and-roles';
import { NotFound } from '../pages/not-found';
import { FirstAdminSetup } from '../pages/setup/first-admin';
import {
  AuthGuard,
  AuthenticatedGuard,
  PermissionGuard,
  SetupCompleteGuard,
  SetupGuard,
} from './guards';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/setup"
        element={
          <SetupCompleteGuard>
            <AuthLayout>
              <FirstAdminSetup />
            </AuthLayout>
          </SetupCompleteGuard>
        }
      />
      <Route
        path="/sign-in"
        element={
          <AuthenticatedGuard>
            <SetupGuard>
              <AuthLayout>
                <SignIn />
              </AuthLayout>
            </SetupGuard>
          </AuthenticatedGuard>
        }
      />
      <Route
        path="/sign-up"
        element={
          <AuthenticatedGuard>
            <AuthLayout>
              <SignUp />
            </AuthLayout>
          </AuthenticatedGuard>
        }
      />
      <Route
        path="/"
        element={
          <SetupGuard>
            <AuthGuard>
              <DashboardLayout>
                <DashboardHome />
              </DashboardLayout>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/assets"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.ASSETS_READ}>
                <DashboardLayout>
                  <Assets />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/search"
        element={
          <SetupGuard>
            <AuthGuard>
              <DashboardLayout>
                <SearchResults />
              </DashboardLayout>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/assets/:id"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.ASSETS_READ}>
                <DashboardLayout>
                  <AssetDetail />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/settings"
        element={<Navigate to="/settings/general" replace />}
      />
      <Route
        path="/settings/general"
        element={
          <SetupGuard>
            <AuthGuard>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/settings/storage"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.STORAGE_UNITS_READ}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/settings/search"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.SEARCH_INDEXES_READ}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/settings/plugins"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.PLUGINS_READ}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/settings/plugins/:pluginId"
        element={
          <SetupGuard>
            <AuthGuard>
              <DashboardLayout>
                <PluginDetails />
              </DashboardLayout>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/settings/storage/configs/:configId"
        element={
          <SetupGuard>
            <AuthGuard>
              <DashboardLayout>
                <StorageProviderConfigDetail />
              </DashboardLayout>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/classifiers"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.CLASSIFIERS_READ}>
                <DashboardLayout>
                  <Classifiers />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/classifiers/create"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.CLASSIFIERS_CREATE}>
                <DashboardLayout>
                  <CreateClassifier />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/classifiers/:classifierId"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.CLASSIFIERS_READ}>
                <DashboardLayout>
                  <ClassifierDetail />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/collections"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.COLLECTIONS_READ}>
                <DashboardLayout>
                  <Collections />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/collections/:id"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.COLLECTIONS_READ}>
                <DashboardLayout>
                  <CollectionDetail />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/users"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.USERS_READ}>
                <DashboardLayout>
                  <UsersAndRoles />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/users/roles"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.ROLES_READ}>
                <DashboardLayout>
                  <UsersAndRoles />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="/users/pending"
        element={
          <SetupGuard>
            <AuthGuard>
              <PermissionGuard permission={Permission.USERS_READ}>
                <DashboardLayout>
                  <UsersAndRoles />
                </DashboardLayout>
              </PermissionGuard>
            </AuthGuard>
          </SetupGuard>
        }
      />
      <Route
        path="*"
        element={
          <SetupGuard>
            <AuthGuard>
              <DashboardLayout>
                <NotFound />
              </DashboardLayout>
            </AuthGuard>
          </SetupGuard>
        }
      />
    </Routes>
  );
}
