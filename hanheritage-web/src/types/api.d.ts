export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface CliffItem {
  id: number
  code: string
  name: string
  lng: number
  lat: number
  area: number
  level: string
  category: string
  dynasty: string
  description: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface CoffinItem {
  id: number
  code: string
  name: string
  cliffId: number
  dynasty: string
  grade: string
  source: string
  completeness: string
  dimensions: string
  texture: string
  description: string
  thumbnail: string
  images: CoffinImage[]
  models: CoffinModel[]
  createdAt: string
  updatedAt: string
}

export interface CoffinImage {
  id: number
  coffinId: number
  imageUrl: string
  imageType: string
  sort: number
  createdAt: string
}

export interface CoffinModel {
  id: number
  coffinId: number
  modelUrl: string
  format: string
  fileSize: number
  createdAt: string
}

export interface PanoramaItem {
  id: number
  name: string
  category: string
  location: string
  description: string
  imageUrl: string
  status: number
  viewpoints: PanoramaViewpoint[]
  hotspots: PanoramaHotspot[]
  createdAt: string
  updatedAt: string
}

export interface PanoramaViewpoint {
  id: number
  panoramaId: number
  name: string
  lng: number
  lat: number
  height: number
  createdAt: string
}

export interface PanoramaHotspot {
  id: number
  panoramaId: number
  type: string
  config: string
  posX: number
  posY: number
  createdAt: string
}

export interface ResourceItem {
  id: number
  name: string
  type: string
  parentId: number
  fileUrl: string
  fileSize: number
  mimeType: string
  children?: ResourceItem[]
  createdAt: string
  updatedAt: string
}

export interface UserInfo {
  id: number
  username: string
  name: string
  phone: string
  email: string
  avatar: string
  deptId: number
  deptName: string
  roles: string[]
  permissions: string[]
  status: number
}

export interface MenuItem {
  id: number
  name: string
  icon: string
  parentId: number
  path: string
  component: string
  sort: number
  type: string
  perms: string
  status: number
  children?: MenuItem[]
}
