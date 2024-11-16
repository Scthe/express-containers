import React from 'react';
import cx from 'classnames';
import { WithClassName } from 'utils';

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> &
  WithClassName & { small?: boolean; danger?: boolean };

export const Button = ({
  className,
  children,
  disabled,
  danger,
  small,
  ...rest
}: Props) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cx(
        `text-base font-medium rounded-md transition-colors text-panel`,
        small ? 'px-2 py-1' : 'px-4 py-2',
        !disabled && !danger && `bg-accent-500 hover:bg-accent-300`,
        !disabled && danger && `bg-red-500 hover:bg-red-300`,
        disabled && 'cursor-not-allowed bg-neutral-500',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
