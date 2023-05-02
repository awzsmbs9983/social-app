import React, {useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Circle, Path} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {HighPriorityImage} from 'view/com/util/images/Image'
import {openCamera, openCropper, openPicker} from '../../../lib/media/picker'
import {
  usePhotoLibraryPermission,
  useCameraPermission,
} from 'lib/hooks/usePermissions'
import {useStores} from 'state/index'
import {colors} from 'lib/styles'
import {DropdownButton} from './forms/DropdownButton'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb, isAndroid} from 'platform/detection'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {AvatarModeration} from 'lib/labeling/types'

const BLUR_AMOUNT = isWeb ? 5 : 100

function DefaultAvatar({size}: {size: number}) {
  return (
    <Svg
      testID="userAvatarFallback"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="none">
      <Circle cx="12" cy="12" r="12" fill="#0070ff" />
      <Circle cx="12" cy="9.5" r="3.5" fill="#fff" />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#fff"
        d="M 12.058 22.784 C 9.422 22.784 7.007 21.836 5.137 20.262 C 5.667 17.988 8.534 16.25 11.99 16.25 C 15.494 16.25 18.391 18.036 18.864 20.357 C 17.01 21.874 14.64 22.784 12.058 22.784 Z"
      />
    </Svg>
  )
}

export function UserAvatar({
  size,
  avatar,
  moderation,
  onSelectNewAvatar,
}: {
  size: number
  avatar?: string | null
  moderation?: AvatarModeration
  onSelectNewAvatar?: (img: RNImage | null) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const dropdownItems = useMemo(
    () => [
      !isWeb && {
        testID: 'changeAvatarCameraBtn',
        label: 'Camera',
        icon: 'camera' as IconProp,
        onPress: async () => {
          if (!(await requestCameraAccessIfNeeded())) {
            return
          }
          onSelectNewAvatar?.(
            await openCamera(store, {
              width: 1000,
              height: 1000,
              cropperCircleOverlay: true,
            }),
          )
        },
      },
      {
        testID: 'changeAvatarLibraryBtn',
        label: 'Library',
        icon: 'image' as IconProp,
        onPress: async () => {
          if (!(await requestPhotoAccessIfNeeded())) {
            return
          }
          const items = await openPicker(store, {
            mediaType: 'photo',
            multiple: false,
          })

          onSelectNewAvatar?.(
            await openCropper(store, {
              mediaType: 'photo',
              path: items[0].path,
              width: 1000,
              height: 1000,
              cropperCircleOverlay: true,
            }),
          )
        },
      },
      {
        testID: 'changeAvatarRemoveBtn',
        label: 'Remove',
        icon: ['far', 'trash-can'] as IconProp,
        onPress: async () => {
          onSelectNewAvatar?.(null)
        },
      },
    ],
    [
      onSelectNewAvatar,
      requestCameraAccessIfNeeded,
      requestPhotoAccessIfNeeded,
      store,
    ],
  )

  const warning = useMemo(() => {
    if (!moderation?.warn) {
      return null
    }
    return (
      <View style={[styles.warningIconContainer, pal.view]}>
        <FontAwesomeIcon
          icon="exclamation-circle"
          style={styles.warningIcon}
          size={Math.floor(size / 3)}
        />
      </View>
    )
  }, [moderation?.warn, size, pal])

  // onSelectNewAvatar is only passed as prop on the EditProfile component
  return onSelectNewAvatar ? (
    <DropdownButton
      testID="changeAvatarBtn"
      type="bare"
      items={dropdownItems}
      openToRight
      rightOffset={-10}
      bottomOffset={-10}
      menuWidth={170}>
      {avatar ? (
        <HighPriorityImage
          testID="userAvatarImage"
          style={{
            width: size,
            height: size,
            borderRadius: Math.floor(size / 2),
          }}
          source={{uri: avatar}}
          accessibilityRole="image"
        />
      ) : (
        <DefaultAvatar size={size} />
      )}
      <View style={[styles.editButtonContainer, pal.btn]}>
        <FontAwesomeIcon
          icon="camera"
          size={12}
          color={pal.text.color as string}
        />
      </View>
    </DropdownButton>
  ) : avatar &&
    !((moderation?.blur && isAndroid) /* android crashes with blur */) ? (
    <View style={{width: size, height: size}}>
      <HighPriorityImage
        testID="userAvatarImage"
        style={{
          width: size,
          height: size,
          borderRadius: Math.floor(size / 2),
        }}
        contentFit="cover"
        source={{uri: avatar}}
        blurRadius={moderation?.blur ? BLUR_AMOUNT : 0}
      />
      {warning}
    </View>
  ) : (
    <View style={{width: size, height: size}}>
      <DefaultAvatar size={size} />
      {warning}
    </View>
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 0,
    right: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray5,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  warningIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 100,
  },
  warningIcon: {
    color: colors.red3,
  },
})
