import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useEditor, EditorContent, JSONContent} from '@tiptap/react'
import {Document} from '@tiptap/extension-document'
import {Link} from '@tiptap/extension-link'
import {Mention} from '@tiptap/extension-mention'
import {Paragraph} from '@tiptap/extension-paragraph'
import {Placeholder} from '@tiptap/extension-placeholder'
import {Text} from '@tiptap/extension-text'
import isEqual from 'lodash.isequal'
import {UserAutocompleteViewModel} from 'state/models/user-autocomplete-view'
import {createSuggestion} from './web/Autocomplete'

export interface TextInputRef {
  focus: () => void
  blur: () => void
}

interface TextInputProps {
  text: string
  placeholder: string
  suggestedLinks: Set<string>
  autocompleteView: UserAutocompleteViewModel
  onTextChanged: (v: string) => void
  onPhotoPasted: (uri: string) => void
  onSuggestedLinksChanged: (uris: Set<string>) => void
  onError: (err: string) => void
}

export const TextInput = React.forwardRef(
  (
    {
      text,
      placeholder,
      suggestedLinks,
      autocompleteView,
      onTextChanged,
      // onPhotoPasted, TODO
      onSuggestedLinksChanged,
    }: // onError, TODO
    TextInputProps,
    ref,
  ) => {
    const editor = useEditor({
      extensions: [
        Document,
        Link.configure({
          protocols: ['http', 'https'],
          autolink: true,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: 'mention',
          },
          suggestion: createSuggestion({autocompleteView}),
        }),
        Paragraph,
        Placeholder.configure({
          placeholder,
        }),
        Text,
      ],
      content: text,
      autofocus: true,
      editable: true,
      injectCSS: true,
      onUpdate({editor: editorProp}) {
        const json = editorProp.getJSON()

        const newText = editorJsonToText(json).trim()
        onTextChanged(newText)

        const newSuggestedLinks = new Set(editorJsonToLinks(json))
        if (!isEqual(newSuggestedLinks, suggestedLinks)) {
          onSuggestedLinksChanged(newSuggestedLinks)
        }
      },
    })

    React.useImperativeHandle(ref, () => ({
      focus: () => {}, // TODO
      blur: () => {}, // TODO
    }))

    return (
      <View style={styles.container}>
        <EditorContent editor={editor} />
      </View>
    )
  },
)

function editorJsonToText(json: JSONContent): string {
  let text = ''
  if (json.type === 'doc' || json.type === 'paragraph') {
    if (json.content?.length) {
      for (const node of json.content) {
        text += editorJsonToText(node)
      }
    }
    text += '\n'
  } else if (json.type === 'text') {
    text += json.text || ''
  } else if (json.type === 'mention') {
    text += `@${json.attrs?.id || ''}`
  }
  return text
}

function editorJsonToLinks(json: JSONContent): string[] {
  let links: string[] = []
  if (json.content?.length) {
    for (const node of json.content) {
      links = links.concat(editorJsonToLinks(node))
    }
  }

  const link = json.marks?.find(m => m.type === 'link')
  if (link?.attrs?.href) {
    links.push(link.attrs.href)
  }

  return links
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'flex-start',
    padding: 5,
    marginLeft: 8,
    marginBottom: 10,
  },
})
