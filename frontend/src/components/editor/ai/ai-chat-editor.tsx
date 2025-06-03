'use client';

import * as React from 'react';

import { withProps } from '@udecode/cn';
import { BaseParagraphPlugin, SlateLeaf } from '@udecode/plate';
import { useAIChatEditor } from '@udecode/plate-ai/react';
import {
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseItalicPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
} from '@udecode/plate-basic-marks';
import { BaseBlockquotePlugin } from '@udecode/plate-block-quote';
import { BaseCalloutPlugin } from '@udecode/plate-callout';
import {
  BaseCodeBlockPlugin,
  BaseCodeLinePlugin,
  BaseCodeSyntaxPlugin,
} from '@udecode/plate-code-block';
import { BaseDatePlugin } from '@udecode/plate-date';
import {
  BaseFontBackgroundColorPlugin,
  BaseFontColorPlugin,
  BaseFontFamilyPlugin,
  BaseFontSizePlugin,
  BaseFontWeightPlugin,
} from '@udecode/plate-font';
import {
  BaseHeadingPlugin,
  BaseTocPlugin,
  HEADING_KEYS,
} from '@udecode/plate-heading';
import { BaseHighlightPlugin } from '@udecode/plate-highlight';
import { BaseHorizontalRulePlugin } from '@udecode/plate-horizontal-rule';
import { BaseIndentPlugin } from '@udecode/plate-indent';
import { BaseIndentListPlugin } from '@udecode/plate-indent-list';
import { BaseKbdPlugin } from '@udecode/plate-kbd';
import { BaseColumnItemPlugin, BaseColumnPlugin } from '@udecode/plate-layout';
import { BaseLinkPlugin } from '@udecode/plate-link';
import {
  BaseEquationPlugin,
  BaseInlineEquationPlugin,
} from '@udecode/plate-math';
import {
  BaseAudioPlugin,
  BaseFilePlugin,
  BaseImagePlugin,
  BaseVideoPlugin,
} from '@udecode/plate-media';
import { BaseMentionPlugin } from '@udecode/plate-mention';
import {
  BaseTableCellHeaderPlugin,
  BaseTableCellPlugin,
  BaseTablePlugin,
  BaseTableRowPlugin,
} from '@udecode/plate-table';
import { usePlateEditor } from '@udecode/plate/react';
import { all, createLowlight } from 'lowlight';

import { markdownPlugin } from '@/components/editor/plugins/markdown-plugin';
import {
  TodoLiStatic,
  TodoMarkerStatic,
} from '@/components/editor/elements/indent/indent-todo-marker-static';

import { BlockquoteElementStatic } from '@/components/ui/blockquote-element-static';
import { CalloutElementStatic } from '@/components/ui/callout-element-static';
import { CodeBlockElementStatic } from '@/components/ui/code-block-element-static';
import { CodeLeaf } from '@/components/editor/elements/leaves/code-leaf';
import { CodeLineElementStatic } from '@/components/ui/code-line-element-static';
import { CodeSyntaxLeaf } from '@/components/editor/elements/leaves/code-syntax-leaf';
import { ColumnElementStatic } from '@/components/ui/column-element-static';
import { ColumnGroupElementStatic } from '@/components/ui/column-group-element-static';
import { DateElement } from '@/components/ui/date-element';
import { EditorStatic } from '@/components/ui/editor-static';
import { EquationElementStatic } from '@/components/ui/equation-element-static';
import { HeadingElementStatic } from '@/components/ui/heading-element-static';
import { HighlightLeaf } from '@/components/editor/elements/leaves/highlight-leaf';
import { HrElement } from '@/components/editor/elements/content/hr-element';
import { ImageElement } from '@/components/editor/elements/media/image-element';
import { InlineEquationElementStatic } from '@/components/ui/inline-equation-element-static';
import { KbdLeaf } from '@/components/editor/elements/leaves/kbd-leaf';
import { LinkElement } from '@/components/editor/elements/content/link-element';
import { MediaAudioElement } from '@/components/editor/elements/media/media-audio-element';
import { MediaFileElement } from '@/components/editor/elements/media/media-file-element';
import { MediaVideoElement } from '@/components/editor/elements/media/media-video-element';
import { MentionElement } from '@/components/editor/elements/interactive/mention-element';
import { ParagraphElement } from '@/components/editor/elements/content/paragraph-element';
import { TableCellElement, TableCellHeaderElement } from '@/components/editor/elements/table/table-cell-element';
import { TableElement } from '@/components/editor/elements/table/table-element';
import { TableRowElement } from '@/components/editor/elements/table/table-row-element';
import { TocElement } from '@/components/editor/elements/content/toc-element';

const components = {
  [BaseAudioPlugin.key]: MediaAudioElement,
  [BaseBlockquotePlugin.key]: BlockquoteElementStatic,
  [BaseBoldPlugin.key]: withProps(SlateLeaf, { as: 'strong' }),
  [BaseCalloutPlugin.key]: CalloutElementStatic,
  [BaseCodeBlockPlugin.key]: CodeBlockElementStatic,
  [BaseCodeLinePlugin.key]: CodeLineElementStatic,
  [BaseCodePlugin.key]: CodeLeaf,
  [BaseCodeSyntaxPlugin.key]: CodeSyntaxLeaf,
  [BaseColumnItemPlugin.key]: ColumnElementStatic,
  [BaseColumnPlugin.key]: ColumnGroupElementStatic,
  [BaseDatePlugin.key]: DateElement,
  [BaseEquationPlugin.key]: EquationElementStatic,
  [BaseFilePlugin.key]: MediaFileElement,
  [BaseHighlightPlugin.key]: HighlightLeaf,
  [BaseHorizontalRulePlugin.key]: HrElement,
  [BaseImagePlugin.key]: ImageElement,
  [BaseInlineEquationPlugin.key]: InlineEquationElementStatic,
  [BaseItalicPlugin.key]: withProps(SlateLeaf, { as: 'em' }),
  [BaseKbdPlugin.key]: KbdLeaf,
  [BaseLinkPlugin.key]: LinkElement,
  [BaseMentionPlugin.key]: MentionElement,
  [BaseParagraphPlugin.key]: ParagraphElement,
  [BaseStrikethroughPlugin.key]: withProps(SlateLeaf, { as: 's' }),
  [BaseSubscriptPlugin.key]: withProps(SlateLeaf, { as: 'sub' }),
  [BaseSuperscriptPlugin.key]: withProps(SlateLeaf, { as: 'sup' }),
  [BaseTableCellHeaderPlugin.key]: TableCellHeaderElement,
  [BaseTableCellPlugin.key]: TableCellElement,
  [BaseTablePlugin.key]: TableElement,
  [BaseTableRowPlugin.key]: TableRowElement,
  [BaseTocPlugin.key]: TocElement,
  [BaseUnderlinePlugin.key]: withProps(SlateLeaf, { as: 'u' }),
  [BaseVideoPlugin.key]: MediaVideoElement,
  [HEADING_KEYS.h1]: withProps(HeadingElementStatic, { variant: 'h1' }),
  [HEADING_KEYS.h2]: withProps(HeadingElementStatic, { variant: 'h2' }),
  [HEADING_KEYS.h3]: withProps(HeadingElementStatic, { variant: 'h3' }),
  // [BaseCommentsPlugin.key]: CommentLeafStatic
  // [BaseTogglePlugin.key]: ToggleElementStatic
};
const lowlight = createLowlight(all);

const plugins = [
  BaseColumnItemPlugin,
  BaseColumnPlugin,
  BaseBlockquotePlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseImagePlugin,
  BaseKbdPlugin,
  BaseBoldPlugin,
  BaseCodeBlockPlugin.configure({ options: { lowlight } }),
  BaseDatePlugin,
  BaseEquationPlugin,
  BaseInlineEquationPlugin,
  BaseCodePlugin,
  BaseItalicPlugin,
  BaseStrikethroughPlugin,
  BaseUnderlinePlugin,
  BaseFontColorPlugin,
  BaseFontSizePlugin,
  BaseFontFamilyPlugin,
  BaseFontWeightPlugin,
  BaseFontBackgroundColorPlugin,
  BaseHeadingPlugin,
  BaseHorizontalRulePlugin,
  BaseTablePlugin,
  BaseTocPlugin,
  BaseHighlightPlugin,
  BaseLinkPlugin,
  BaseMentionPlugin,
  BaseParagraphPlugin,
  BaseCalloutPlugin,
  BaseIndentPlugin.extend({
    inject: {
      targetPlugins: [BaseParagraphPlugin.key],
    },
  }),
  BaseIndentListPlugin.extend({
    inject: {
      targetPlugins: [BaseParagraphPlugin.key],
    },
    options: {
      listStyleTypes: {
        todo: {
          liComponent: TodoLiStatic,
          markerComponent: TodoMarkerStatic,
          type: 'todo',
        },
      },
    },
  }),
  markdownPlugin,
];

export const AIChatEditor = React.memo(function AIChatEditor({
  content,
}: {
  content: string;
}) {
  const aiEditor = usePlateEditor({
    plugins,
  });

  useAIChatEditor(aiEditor, content);

  return (
    <EditorStatic variant="aiChat" components={components} editor={aiEditor} />
  );
});
