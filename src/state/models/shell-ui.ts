import {RootStoreModel} from './root-store'
import {makeAutoObservable} from 'mobx'
import {ProfileViewModel} from './profile-view'
import {isObj, hasProp} from 'lib/type-guards'
import {PickedMedia} from 'lib/media/types'

export interface ConfirmModal {
  name: 'confirm'
  title: string
  message: string | (() => JSX.Element)
  onPressConfirm: () => void | Promise<void>
}

export interface EditProfileModal {
  name: 'edit-profile'
  profileView: ProfileViewModel
  onUpdate?: () => void
}

export interface ServerInputModal {
  name: 'server-input'
  initialService: string
  onSelect: (url: string) => void
}

export interface ReportPostModal {
  name: 'report-post'
  postUri: string
  postCid: string
}

export interface ReportAccountModal {
  name: 'report-account'
  did: string
}

export interface CropImageModal {
  name: 'crop-image'
  uri: string
  onSelect: (img?: PickedMedia) => void
}

export interface DeleteAccountModal {
  name: 'delete-account'
}

export type Modal =
  | ConfirmModal
  | EditProfileModal
  | ServerInputModal
  | ReportPostModal
  | ReportAccountModal
  | CropImageModal
  | DeleteAccountModal

interface LightboxModel {}

export class ProfileImageLightbox implements LightboxModel {
  name = 'profile-image'
  constructor(public profileView: ProfileViewModel) {
    makeAutoObservable(this)
  }
}

export class ImagesLightbox implements LightboxModel {
  name = 'images'
  constructor(public uris: string[], public index: number) {
    makeAutoObservable(this)
  }
  setIndex(index: number) {
    this.index = index
  }
}

export interface ComposerOptsPostRef {
  uri: string
  cid: string
  text: string
  author: {
    handle: string
    displayName?: string
    avatar?: string
  }
}
export interface ComposerOpts {
  imagesOpen?: boolean
  replyTo?: ComposerOptsPostRef
  onPost?: () => void
}

export class ShellUiModel {
  darkMode = false
  minimalShellMode = false
  isMainMenuOpen = false
  isModalActive = false
  activeModals: Modal[] = []
  isLightboxActive = false
  activeLightbox: ProfileImageLightbox | ImagesLightbox | undefined
  isComposerActive = false
  composerOpts: ComposerOpts | undefined

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      serialize: false,
      rootStore: false,
      hydrate: false,
    })
  }

  serialize(): unknown {
    return {
      darkMode: this.darkMode,
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'darkMode') && typeof v.darkMode === 'boolean') {
        this.darkMode = v.darkMode
      }
    }
  }

  setDarkMode(v: boolean) {
    this.darkMode = v
  }

  setMinimalShellMode(v: boolean) {
    this.minimalShellMode = v
  }

  setMainMenuOpen(v: boolean) {
    this.isMainMenuOpen = v
  }

  openModal(modal: Modal) {
    this.rootStore.emitNavigation()
    this.isModalActive = true
    this.activeModals.push(modal)
  }

  closeModal() {
    this.activeModals.pop()
    this.isModalActive = this.activeModals.length > 0
  }

  openLightbox(lightbox: ProfileImageLightbox | ImagesLightbox) {
    this.rootStore.emitNavigation()
    this.isLightboxActive = true
    this.activeLightbox = lightbox
  }

  closeLightbox() {
    this.isLightboxActive = false
    this.activeLightbox = undefined
  }

  openComposer(opts: ComposerOpts) {
    this.rootStore.emitNavigation()
    this.isComposerActive = true
    this.composerOpts = opts
  }

  closeComposer() {
    this.isComposerActive = false
    this.composerOpts = undefined
  }
}
