# 样式测试

## 标题

# 一级标题 Heading 1

## 二级标题 Heading 2

### 三级标题 Heading 3

#### 四级标题 Heading 4

##### 五级标题 Heading 5

###### 六级标题 Heading 6

## 目录 TOC

[toc]{type: "ol", level: [2,3]}

## 行内语法 Inline Syntax

- _斜体 Italic_
- **粗体 Bold**
- ~~删除线 Strikethrough~~
- ==高亮 Highlight==
- ^上标\ Supscript^
- ~下标\ Subscript~
- `行内代码 Inline Code`
- $行内公式~Inline~Formula$
- [链接 Link](https://www.baidu.com/)
- 缩写 Abbreviation
- 脚注 Footnote [^footnote]

*[缩写 Abbreviation]: Lorem ipsum dolor sit amet.
[^footnote]: Lorem ipsum dolor sit amet.

## 引用块 Blockquote

> 科学家在思想中给予我们以秩序; 道德在行动中给予我们以秩序; 艺术才在对可见、可触、可听的外观的把握中给予我们以秩序. &emsp;——卡西尔

## 代码块 Fence

```cpp
#include <iostream>
int main(){
    std::cout << "Hello, World!";
    return 0;
}
```

## 列表 List

无序列表 Unordered List

- 无序列表项
- 无序列表项
- 无序列表项

有序列表 Ordered List

1. 有序列表项
2. 有序列表项
3. 有序列表项

待办事项列表 Todo List

- [x] ~~2023-04-24 20:37~~ 待办事项
- [x] ~~2023-04-24 20:37~~ 待办事项
- [ ] 待办事项

## 表格 Table

| 表头 | 表头 | 表头 |
| :------- | :------------: | -------: |
| 左对齐 | 居中对齐 | 右对齐 |
| 左对齐 👉 | 👈 居中对齐 👉 | 👈 右对齐 |
| 左对齐 | 居中对齐 | 右对齐 |

## 图像 Image

![](https://cdn.stocksnap.io/img-thumbs/960w/healthy-breakfast_FY5YYPG1LS.jpg)

## 水平线 Horizontal Line

---

## 行间公式 Display Formula

$$
ax^2+bx+c=0\\
x_1,x_2=\frac{-b\pm\sqrt{b^2-4ac}}{2a}
$$

## 容器块 Container

::: tip 提示容器 Tip
Lorem ipsum dolor sit amet.
:::

::: warning 警告容器 Warning
Lorem ipsum dolor sit amet.
:::

::: danger 危险容器 Danger
Lorem ipsum dolor sit amet.
:::

::: section 部分容器 Section
Lorem ipsum dolor sit amet.
:::

::: section
Lorem ipsum dolor sit amet.
:::

::: details 详情容器 Details
Lorem ipsum dolor sit amet.
:::

::: details
Lorem ipsum dolor sit amet.
:::

:::: row 行容器 Row
::: col 列容器 Column 1
Lorem ipsum dolor sit amet.
:::
::: col Column 2
Lorem ipsum dolor sit amet.
:::
::: col Column 3
Lorem ipsum dolor sit amet.
:::
::::

:::: row
::: col
Lorem ipsum dolor sit amet.
:::
::: col
Lorem ipsum dolor sit amet.
:::
::: col
Lorem ipsum dolor sit amet.
:::
::::

:::: group 组容器 Group
::: group-item 项容器 Item 1
Lorem ipsum dolor sit amet.
:::
::: group-item Item 2
Lorem ipsum dolor sit amet.
:::
::: group-item Item 3
Lorem ipsum dolor sit amet.
:::
::::

:::: group
::: group-item
Lorem ipsum dolor sit amet.
:::
::: group-item
Lorem ipsum dolor sit amet.
:::
::: group-item
Lorem ipsum dolor sit amet.
:::
::::

## 数学环境 Math Env

\begin{axiom}
Homo 是一个公理.
\end{axiom}

\begin{definition}
Homo 是一个定义.
\end{definition}

\begin{proposition}
Homo 是一个命题.
\end{proposition}

\begin{theorem*}
Homo 是一个跳过编号的定理.
\end{theorem*}

\begin{lemma}[田所引理]
Homo 是一个有标题的引理.
\end{lemma}

\begin{corollary*}[妖王推论]
Homo 是一个跳过编号、有标题的推论.
\end{corollary*}

\begin{property}
Homo 是一个性质.
\end{property}

\begin{problem}
Homo 是一个问题.
\end{problem}

\begin{example}
Homo 是一个示例.
\end{example}

\begin{exercise}
Homo 是一个练习.
\end{exercise}

\begin{note}
Homo 是一个笔记.
\end{note}

\begin{conclusion}
Homo 是一个结论.
\end{conclusion}

\begin{assumption}
Homo 是一个假设.
\end{assumption}

\begin{remark}
Homo 是一个注解.
\end{remark}

\begin{solution}
Homo 是一个解答.
\end{solution}

\begin{proof}
Homo 是一个证明.
\end{proof}

\newtheorem{homo}{哼哼}[2][{"hue":35}]

\begin{homo}[嗯嗯♂]
自定义环境好臭啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊!!!
\end{homo}
