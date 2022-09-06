import {makeAutoObservable, runInAction} from 'mobx'
import {bsky} from '@adxp/mock-api'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'

export class ProfileViewMyStateModel {
  hasFollowed: boolean = false

  constructor() {
    makeAutoObservable(this)
  }
}

export class ProfileViewModel implements bsky.ProfileView.Response {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: bsky.ProfileView.Params

  // data
  did: string = ''
  name: string = ''
  displayName: string = ''
  description: string = ''
  followersCount: number = 0
  followsCount: number = 0
  postsCount: number = 0
  badges: bsky.ProfileView.Badge[] = []
  myState = new ProfileViewMyStateModel()

  constructor(
    public rootStore: RootStoreModel,
    params: bsky.ProfileView.Params,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.params = params
  }

  get hasContent() {
    return this.did !== ''
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  async setup() {
    await this._load()
  }

  async refresh() {
    await this._load(true)
  }

  async toggleFollowing() {
    if (this.myState.hasFollowed) {
      await apilib.unfollow(this.rootStore.api, 'alice.com', {
        did: this.did,
      })
      runInAction(() => {
        this.followersCount--
        this.myState.hasFollowed = false
      })
    } else {
      await apilib.follow(this.rootStore.api, 'alice.com', {
        did: this.did,
        name: this.name,
      })
      runInAction(() => {
        this.followersCount++
        this.myState.hasFollowed = true
      })
    }
  }

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err: string = '') {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err
  }

  // loader functions
  // =

  private async _load(isRefreshing = false) {
    this._xLoading(isRefreshing)
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    try {
      const res = (await this.rootStore.api.mainPds.view(
        'blueskyweb.xyz:ProfileView',
        this.params,
      )) as bsky.ProfileView.Response
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private _replaceAll(res: bsky.ProfileView.Response) {
    this.did = res.did
    this.name = res.name
    this.displayName = res.displayName
    this.description = res.description
    this.followersCount = res.followersCount
    this.followsCount = res.followsCount
    this.postsCount = res.postsCount
    this.badges = res.badges
    if (res.myState) {
      Object.assign(this.myState, res.myState)
    }
  }
}
