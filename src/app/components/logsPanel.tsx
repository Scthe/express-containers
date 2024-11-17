import { QUICK_JS_CONSOLE_TAG } from 'app/quick-js/globals/console';
import {
  CONSOLE_INTERCEPTORS,
  ConsoleInterceptorParams,
  ConsoleLevel,
} from 'app/web/hacks';
import React, { Fragment, memo, useRef } from 'react';
import { useEffect, useState } from 'react';
import cx from 'classnames';
import { stringify } from 'utils';
import { HeaderLogs } from './header';

type LogOrigin = 'host' | 'vm' | 'service_worker';

interface LogLine {
  id: number;
  level: ConsoleLevel;
  origin: LogOrigin;
  args: unknown[];
}

const MAX_ENTRIES = 1000;
let NEXT_LOG_LINE_ID = 1;

// TODO add 'clear' button
// TODO add 'autoscroll' checkbox
export function LogsPanel() {
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [scrollToBottom, setScrollToBottom] = useState(true); // TODO use
  const listElRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const listener = ({ level, args }: ConsoleInterceptorParams) => {
      const isVm = JSON.stringify(args[0]).includes(QUICK_JS_CONSOLE_TAG);
      const newLogLine: LogLine = {
        id: NEXT_LOG_LINE_ID++,
        level,
        origin: isVm ? 'vm' : 'host',
        args,
      };
      setLogLines((lines) => {
        let nextState = [...lines, newLogLine];
        nextState = nextState.slice(
          Math.max(0, nextState.length - MAX_ENTRIES)
        );
        return nextState;
      });
    };
    // setInterval(() => {
    // listener('warn', 'adasdasdasda');
    // }, 1000);

    CONSOLE_INTERCEPTORS.add(listener);
    return () => {
      CONSOLE_INTERCEPTORS.remove(listener);
    };
  }, []);

  useEffect(() => {
    const el = listElRef.current;
    if (el && scrollToBottom) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest',
      });
    }
  }, [logLines, scrollToBottom]);

  return (
    <Fragment>
      <HeaderLogs />

      <ol className="h-0 px-2 pb-2 overflow-y-auto grow">
        {logLines.map((line) => (
          <LogLineItem key={line.id} {...line} />
        ))}
        <li ref={listElRef} className="h-[0px] w-full"></li>
      </ol>
    </Fragment>
  );
}

const LogLineItem = memo(LogLineItem__);

function LogLineItem__({ level, origin, args }: LogLine) {
  const msg = args.map((e) => stringify(e)).join(' ');

  return (
    <li
      className={cx(
        'flex gap-1 mt-1',
        level === 'error' && 'bg-red-900/30',
        level === 'warn' && 'bg-yellow-900/30'
      )}
    >
      <LogOriginBadge origin={origin} />
      <span>{msg}</span>
    </li>
  );
}

export const LogOriginBadge = ({ origin }: { origin: LogOrigin }) => {
  let text = 'host';
  let className = 'bg-accent-800';

  if (origin === 'vm') {
    text = 'quick_js';
    className = 'bg-pink-800';
  }
  if (origin === 'service_worker') {
    text = 'service worker';
    className = 'bg-sky-900';
  }

  return (
    <span className={`rounded-sm uppercase ${className}`}>
      &nbsp;{text}&nbsp;
    </span>
  );
};
