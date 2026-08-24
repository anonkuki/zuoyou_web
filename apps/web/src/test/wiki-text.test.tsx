import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WikiText } from '../components/blog/WikiText';

afterEach(cleanup);

describe('WikiText', () => {
  it('renders a safe basic subset of SCP-style wiki syntax', () => {
    const { container } = render(<article><WikiText text={`+ 一级标题

**粗体**、//斜体//、__下划线__、--删除线--、{{等宽}}、^^上标^^、,,下标,,

* 无序条目
* 第二条目

# 第一项
# 第二项

> 引用文字
----
[[https://example.com 示例页面]]
[!-- 隐藏内容 --]
<script>alert(1)</script>`} /></article>);

    expect(screen.getByRole('heading', { name: '一级标题', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('粗体').tagName).toBe('STRONG');
    expect(screen.getByText('斜体').tagName).toBe('EM');
    expect(screen.getByText('下划线').tagName).toBe('U');
    expect(screen.getByText('删除线').tagName).toBe('DEL');
    expect(screen.getByText('等宽').tagName).toBe('CODE');
    expect(screen.getByText('上标').tagName).toBe('SUP');
    expect(screen.getByText('下标').tagName).toBe('SUB');
    const lists = screen.getAllByRole('list');
    expect(lists[0].tagName).toBe('UL');
    expect(lists[1].tagName).toBe('OL');
    expect(container.querySelector('blockquote')).toHaveTextContent('引用文字');
    expect(container.querySelector('hr')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '示例页面' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.queryByText('隐藏内容')).not.toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  });
});
