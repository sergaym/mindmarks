'use client';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  useColorDropdownMenu,
  useColorDropdownMenuState,
} from '@udecode/plate-font/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DEFAULT_COLORS, DEFAULT_CUSTOM_COLORS } from '../../ui/color-constants';
import { ColorPicker } from '../../ui/color-picker';
import { ToolbarButton } from '@/components/editor/ui/core/toolbar';

type ColorDropdownMenuProps = {
  nodeType: string;
  tooltip?: string;
} & DropdownMenuProps;

export function ColorDropdownMenu({
  children,
  nodeType,
  tooltip,
}: ColorDropdownMenuProps) {
  const state = useColorDropdownMenuState({
    closeOnSelect: true,
    colors: DEFAULT_COLORS,
    customColors: DEFAULT_CUSTOM_COLORS,
    nodeType,
  });

  const { buttonProps, menuProps } = useColorDropdownMenu(state);

  return (
    <DropdownMenu modal={false} {...menuProps}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip={tooltip} {...buttonProps}>
          {children}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <ColorPicker
          color={state.selectedColor || state.color}
          clearColor={state.clearColor}
          colors={state.colors}
          customColors={state.customColors}
          updateColor={state.updateColorAndClose}
          updateCustomColor={state.updateColor}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
