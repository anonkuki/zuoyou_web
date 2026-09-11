import { describe, expect, it } from 'vitest';
// @ts-expect-error Vite resolves raw CSS imports during Vitest execution.
import quickChatCss from './quick-chat.css?raw';

function ruleBody(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return quickChatCss.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

describe('quick chat layout', () => {
  it('starts sparse messages at the top while keeping the message region scrollable', () => {
    const messagesRule = ruleBody('.quick-chat-messages');

    expect(messagesRule).toContain('justify-content: flex-start');
    expect(messagesRule).toContain('overflow-y: auto');
  });
});
