'use client';

import * as React from 'react';

import {
  useMarkToolbarButton,
  useMarkToolbarButtonState,
} from '@udecode/plate/react';

import { ToolbarButton } from '@/components/editor/ui/core/toolbar';

export function MarkToolbarButton({
  clear,
  nodeType,
  ...props
}: React.ComponentProps<typeof ToolbarButton> & {
  nodeType: string;
  clear?: string[] | string;
}) {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props: buttonProps } = useMarkToolbarButton(state);

  return <ToolbarButton {...props} {...buttonProps} />;
}
