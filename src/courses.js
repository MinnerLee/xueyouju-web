export const courses = [
  { id: 'math', title: '工科数学分析', en: 'ENGINEERING MATHEMATICS', symbol: '∂', subtitle: '从条件出发，把每一步推理说清楚。', chapters: '极限与连续 / 导数 / 中值定理', color: 'green' },
  { id: 'c', title: 'C 语言程序设计', en: 'C PROGRAMMING', symbol: '{ }', subtitle: '跟着变量走，读懂代码背后的逻辑。', chapters: '循环边界 / 数组 / 函数参数', color: 'blue' },
];

// All evidence, prompts and exercises below are original demonstration content.
// A source locator refers to docs/original-notes.md, never to a fabricated textbook page.
export const topics = [
  {
    id: 'continuity', courseId: 'math', title: '连续与可导', chapter: '01 · 导数的定义', time: '5 分钟',
    question: '一个函数在某点连续，就一定在该点可导吗？',
    prompt: '试着从定义出发，找一个能支持或推翻这个判断的例子。',
    evidence: '在 x₀ 处可导，要求差商 [f(x₀+h)−f(x₀)]/h 在 h→0 时存在有限极限。可导必连续，但连续不能保证左右差商趋于同一个值。',
    source: '自编学习札记 §1', anchor: 'continuity',
    hints: ['先分别写出“连续”和“可导”需要检查的极限。它们对变化率的要求相同吗？', '考察 f(x)=|x| 在 x=0 附近的图像。左右两侧的斜率一样吗？', '在 x=0 处，h>0 时 |h|/h=1，h<0 时 |h|/h=−1。比较这两个单侧极限。'],
    solution: '不一定。f(x)=|x| 在 0 处连续，因为 lim(x→0)|x|=f(0)=0。但它的左导数为 −1，右导数为 1，导数不存在。这给出了“连续未必可导”的反例。',
    exercise: { question: '设 f(x)=x（x≥0），f(x)=2x（x<0）。f 在 0 处的性质是？', options: ['连续且可导', '连续但不可导', '不连续但可导', '不连续且不可导'], answer: 1, explanation: '两侧函数极限和 f(0) 都等于 0，因此连续；左导数为 2，右导数为 1，因此不可导。' },
  },
  {
    id: 'limit', courseId: 'math', title: '极限与函数值', chapter: '02 · 极限与连续', time: '4 分钟',
    question: '函数在一点没有定义，还能有该点的极限吗？',
    prompt: '想一想：极限描述的是点上的取值，还是附近的变化趋势？',
    evidence: '函数在 x₀ 处的极限研究去心邻域内 x 趋近 x₀ 时的函数值，不要求 f(x₀) 存在。连续则要求 f(x₀) 有定义，且极限等于这个函数值。',
    source: '自编学习札记 §2', anchor: 'limit',
    hints: ['注意极限定义里的条件 0<|x−x₀|<δ。它包含 x=x₀ 吗？', '考察 g(x)=(x²−1)/(x−1)，它在 x=1 没有定义。', '当 x≠1 时，g(x)=x+1。用这个等式考察 x→1 的过程。'],
    solution: '可以。g(x)=(x²−1)/(x−1) 在 1 处没有定义，但在 x≠1 时等于 x+1，故 x→1 时极限为 2。函数值是否存在与去心极限是否存在是不同的问题。',
    exercise: { question: '若 f(x)=(x²−4)/(x−2)（x≠2），f(2)=7，那么 lim(x→2) f(x) 等于？', options: ['7', '0', '4', '不存在'], answer: 2, explanation: '在 x≠2 时，f(x)=x+2，极限为 4。f(2)=7 不改变极限，但使函数在 2 处不连续。' },
  },
  {
    id: 'mean-value', courseId: 'math', title: '中值定理的条件', chapter: '03 · 微分中值定理', time: '6 分钟',
    question: '为什么不能对 f(x)=|x| 在 [−1,1] 上直接套用拉格朗日中值定理？',
    prompt: '先列出定理的适用条件，再逐项核对这个函数。',
    evidence: '若 f 在闭区间 [a,b] 连续，并在开区间 (a,b) 可导，则存在 ξ∈(a,b)，使 f′(ξ)=[f(b)−f(a)]/(b−a)。闭区间连续和开区间可导都需要核验。',
    source: '自编学习札记 §3', anchor: 'mean-value',
    hints: ['把“闭区间连续”和“开区间可导”分开检查。', '0 在开区间 (−1,1) 内，|x| 在 0 处的导数存在吗？', '|x| 在 0 处不可导。这里缺少的是定理的假设，而不是计算平均变化率的方法。'],
    solution: '|x| 在 [−1,1] 上连续，但在内点 0 处不可导，不满足定理条件。两端函数值相同，平均变化率为 0；其余内点的导数仅为 −1 或 1，确实不存在导数为 0 的内点。',
    exercise: { question: 'f(x)=x² 在 [1,3] 上满足拉格朗日中值定理。对应的 ξ 是？', options: ['1', '2', '3', '4'], answer: 1, explanation: '平均变化率为 (9−1)/(3−1)=4。由 f′(ξ)=2ξ=4 得 ξ=2，且 2∈(1,3)。' },
  },
  {
    id: 'loop', courseId: 'c', title: '循环的最后一步', chapter: '01 · 循环边界', time: '4 分钟',
    question: '为什么这个循环漏掉了数组最后一个元素？', code: 'int a[5] = {2, 4, 6, 8, 10};\nfor (int i = 0; i < 4; i++) {\n    printf("%d ", a[i]);\n}',
    prompt: '先写出 i 实际经过的值，再对照数组的合法下标。',
    evidence: '长度为 n 的数组，其元素下标为 0 到 n−1。for 循环每次进入循环体前检查条件；i<4 只允许 i 为 0、1、2、3。这里的说明是静态推演，不是代码执行结果。',
    source: '自编学习札记 §4', anchor: 'loop',
    hints: ['数组有 5 个元素，最后一个元素的下标是多少？', '当 i 从 3 增加到 4 时，条件 i<4 还成立吗？', '让 i 覆盖 0 到 4，同时避免访问 a[5]。可以将条件写为 i<5。'],
    solution: '循环实际访问 a[0] 到 a[3]，没有访问 a[4]。将条件改为 i<5，即可遍历 5 个元素。写成 i<=5 会访问非法下标 5。',
    exercise: { question: '对于 int a[8]，从 i=0 开始、每次 i++，完整且不越界的循环条件是？', options: ['i < 7', 'i <= 8', 'i < 8', 'i > 0'], answer: 2, explanation: '合法下标为 0 到 7，所以 i<8 恰好覆盖所有元素。' },
  },
  {
    id: 'array', courseId: 'c', title: '数组下标与长度', chapter: '02 · 数组', time: '4 分钟',
    question: '声明 int a[6] 后，a[6] 是第六个元素吗？',
    prompt: '把“第几个元素”和“下标”分成两列，写出前三项的对应关系。',
    evidence: 'C 数组采用从 0 开始的下标。a[0] 是第一个元素，a[n−1] 是第 n 个元素。对长度为 n 的数组读写 a[n] 属于越界，行为未定义。',
    source: '自编学习札记 §5', anchor: 'array',
    hints: ['第一个元素的下标是 0，第二个呢？', '第 k 个元素对应下标 k−1。', '长度为 6 的数组，其下标集合为 {0,1,2,3,4,5}。'],
    solution: '不是。第六个元素是 a[5]。a[6] 位于数组合法元素范围之外，不能作为本数组元素读写；不能假设它会返回某个固定的值。',
    exercise: { question: 'int scores[10] 中，第 9 个元素应写为？', options: ['scores[9]', 'scores[10]', 'scores[8]', 'scores[1]'], answer: 2, explanation: '第 k 个元素的下标是 k−1，因此第 9 个元素为 scores[8]。' },
  },
  {
    id: 'parameter', courseId: 'c', title: '函数参数的传递', chapter: '03 · 函数', time: '5 分钟',
    question: '在函数里修改一个 int 参数，会改变调用者的变量吗？', code: 'void change(int n) {\n    n = 20;\n}\nint x = 7;\nchange(x);',
    prompt: '区分调用者的 x 与函数内部的 n，它们是同一个变量吗？',
    evidence: 'C 函数的普通参数采用值传递。形参得到实参值的副本，对这个形参重新赋值，不会改变调用者的原变量。可以通过传入地址并解引用修改所指对象。',
    source: '自编学习札记 §6', anchor: 'parameter',
    hints: ['进入 change 时，n 获得 x 当前值的副本。', 'n=20 改写的是函数中的局部形参 n。', '若要修改 x，需要设计接收 int* 的函数，传入 &x，并在函数内修改 *指针。'],
    solution: '不会。change 的形参 n 与调用者的 x 是不同变量。这里函数返回后 x 仍为 7；这是依据值传递规则的静态推演，并未执行任意用户代码。',
    exercise: { question: 'void f(int n){n++;} 调用前 a=3，执行 f(a) 后 a 的值是？', options: ['4', '3', '0', '无法确定'], answer: 1, explanation: 'n++ 仅改变形参副本，调用者的 a 仍为 3。' },
  },
];

export function getTopic(id) { return topics.find(topic => topic.id === id); }
export function grade(topicId, answerIndex) {
  const topic = getTopic(topicId);
  if (!topic || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= topic.exercise.options.length) throw new Error('无效的题目或选项');
  return { correct: answerIndex === topic.exercise.answer, explanation: topic.exercise.explanation };
}
export function recommendation(attempt) {
  if (!attempt.correct) return '先核对课程依据，再做一次同知识点练习。';
  if (attempt.hintLevel > 0 || attempt.solutionViewed) return '本次借助提示或解析完成，建议稍后独立复练。';
  return '本次独立答对；可继续下一个知识点，之后再检验保持情况。';
}
