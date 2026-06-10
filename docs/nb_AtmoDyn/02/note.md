---
title: 大气运动中的热力学第一定律
author: Zhenghang Liu
date: 2026-06-04 傍晚
words: 8000
duration: 15
---

## 1. 前置经典热力学知识

研究大气热力学，首先需要奠定基本状态参量与守恒定律的基础。对于一系统，其基本物理规律和状态方程描述如下：

### 1.1 热力学第一定律

热力学第一定律本质上是能量守恒定律的宏观表现形式。对于一个封闭系统，其吸收的热量 $\delta Q$ 一方面用于增加系统的内能 $\mathrm{d}U$，另一方面用于对外做功 $\delta W$：

$$
\begin{aligned}
\mathrm{d}U &= \delta Q - \delta W \\\\
\delta Q &= \mathrm{d}U + \delta W
\end{aligned} \tag{2.1}
$$

### 1.2 理想气体状态方程

由于地球大气在绝大多数情况下可近似视为理想气体，其状态方程满足：
$$p = \rho RT \tag{2.2}$$

其中 $p$ 为气压，$\rho$ 为空气密度，$T$ 为绝对温度。**比气体常数** $R$ 定义为：
$$R = \frac{R_u}{M}$$
这里 $R_u$ 为通用气体常数，$M$ 为气体的摩尔质量。对于不含水汽的**干空气**，其平均摩尔质量约为 $28.97 \text{ g}\cdot\text{mol}^{-1}$，计算得到其比气体常数 $R \approx 287 \text{ J}\cdot\text{kg}^{-1}\cdot\text{K}^{-1}$。

### 1.3 核心热力学函数的定义

为了便于在不同独立变量下描述系统状态，我们引入以下经典热力学势与状态函数的定义：

- **熵 (Entropy, $S$)**：描述物理过程的可逆性与系统无序度，微分定义为：$$\mathrm{d}S = \frac{\delta Q}{T}$$
- **焓 (Enthalpy, $H$)**：描述系统内能与压力体积功的复合总能量：$$H = U + pV$$
- **亥姆霍兹自由能 (Helmholtz Free Energy, $F$)**：描述定温定容下系统能够对外做的最大有用功：$$F = U - TS$$

将功的微元形式 $\delta W = p\mathrm{d}V$ 与熵的微分项代入式 (2.1)，即可得到**热力学第一定律的基本微分形式**：
$$\mathrm{d}U = T\mathrm{d}S - p\mathrm{d}V \tag{2.3}$$

---

## 2. 比热容的精准定义与演化

比热容是联系系统温度变化与热量交换的桥梁。通过前述热力学势的定义，我们可以在不同的物理路径下定义截然不同的比热容。

### 2.1 定容比热容

定容比热容定义为在约束系统体积不变（定容过程）时，系统温度每升高一开尔文所吸收的热量：
$$c_V = \left(\frac{\delta Q}{\mathrm{d}T}\right)_V \tag{3.1}$$

在定容过程中，系统不发生对外膨胀功，即 $\mathrm{d}V=0$。结合热力学第一定律微分形式 (2.3) 可得：
$$\mathrm{d}U = T\mathrm{d}S - 0 = T\mathrm{d}S = \delta Q$$
因此，定容比热容也可以直接用内能对温度的偏导数来严格表示：
$$\left(\frac{\partial U}{\partial T}\right)_V = \left(\frac{\delta Q}{\mathrm{d}T}\right)_V = c_V \tag{3.2}$$

### 2.2 定压比热容

定压比热容定义为在约束系统压力不变（定压过程）时，系统温度变化与吸收热量的比值：
$$c_p = \left(\frac{\delta Q}{\mathrm{d}T}\right)_p \tag{3.3}$$

这里我们借助**焓 ($H$)** 的工具进行推导。对焓的定义式进行全微分展开：
$$\mathrm{d}H = \mathrm{d}U + p\mathrm{d}V + V\mathrm{d}p \tag{3.4}$$

将热力学第一定律表达式 $\mathrm{d}U = T\mathrm{d}S - p\mathrm{d}V$ 代入上式中，消除消去体积功项：

$$
\begin{aligned}
\mathrm{d}H &= (T\mathrm{d}S - p\mathrm{d}V) + p\mathrm{d}V + V\mathrm{d}p \\\\
&= T\mathrm{d}S + V\mathrm{d}p
\end{aligned} \tag{4.1}
$$

对于定压物理过程，气压恒定即 $\mathrm{d}p = 0$，上式简化为 $\mathrm{d}H = T\mathrm{d}S = \delta Q$。由此可得：
$$\left(\frac{\mathrm{d} H}{\mathrm{d} T}\right)_p = \left(\frac{\delta Q}{\mathrm{d}T}\right)_p = c_p \tag{4.2}$$

### 2.3 小结：两个比热容的偏微分特征方程

综上所述，系统的定容比热容与定压比热容在数学上具有极其对称的唯象表述：

$$
\begin{cases}
\displaystyle c_V = \left(\frac{\partial U}{\partial T}\right)_V \\\\
\displaystyle c_p = \left(\frac{\mathrm{d} H}{\mathrm{d} T}\right)_p
\end{cases} \tag{4.3}
$$

---

## 3. 麦克斯韦关系式

为了进一步探究理想气体的内能构型，我们需要预先推导一条关键的麦克斯韦关系式。

利用亥姆霍兹自由能 $F = U - TS$ 的微分展开：
$$\mathrm{d}F = \mathrm{d}U - T\mathrm{d}S - S\mathrm{d}T \tag{5.1}$$

将热力学第一定律表达式 (2.3) 代入式 (5.1) 中消去内能项：
$$\mathrm{d}F = -S\mathrm{d}T - p\mathrm{d}V \tag{5.2}$$

从数学上来看，$F$ 可以写为温度 $T$ 和体积 $V$ 的状态函数，即 $F = F(T,V)$。其全微分数学形式为：
$$\mathrm{d}F = \left( \frac{\partial{F}}{\partial{T}} \right)_V \mathrm{d}T + \left( \frac{\partial{F}}{\partial{V}} \right)_T \mathrm{d}V$$
对比偏导数系数，我们显然可以得出：
$$\left( \frac{\partial{F}}{\partial{T}} \right)_V = -S, \quad \left( \frac{\partial{F}}{\partial{V}} \right)_T = -p \tag{5.3}$$

由于状态函数 $F$ 的全微分具有二阶连续偏导数，其实际求导顺序可交换：
$$\frac{\partial{}}{\partial{V}}\left[\left( \frac{\partial{F}}{\partial{T}} \right)_V \right]_T = \frac{\partial{}}{\partial{T}}\left[\left( \frac{\partial{F}}{\partial{V}} \right)_T \right]_V \tag{5.4}$$
将式 (5.3) 的对应项代入上式，负号两消，便得到了后续推导极为关键的**麦克斯韦关系式**：
$$\left( \frac{\partial{S}}{\partial{V}} \right)_T = \left( \frac{\partial{p}}{\partial{T}} \right)_V \tag{5.5}$$

---

## 4. 理想气体唯象内能方程的证明

设系统的熵由状态参量 $T$ 和 $V$ 决定，即 $S=S(T,V)$，则其全微分为：
$$\mathrm{d}S = \left( \frac{\partial{S}}{\partial{T}} \right)_V \mathrm{d}T + \left( \frac{\partial{S}}{\partial{V}} \right)_T \mathrm{d}V \tag{6.1}$$

将式 (6.1) 代入系统基本的内能微分方程 $\mathrm{d}U = T\mathrm{d}S - p\mathrm{d}V$ 中：
$$\mathrm{d}U = T\left( \frac{\partial{S}}{\partial{T}} \right)_V\mathrm{d}T + \left[ T \left( \frac{\partial{S}}{\partial{V}} \right)_T - p \right]\mathrm{d}V \tag{6.2}$$

将上一节推导出的麦克斯韦关系式 (5.5) 代入，替换掉上式右侧第二项的括号内容：
$$\mathrm{d}U = T\left( \frac{\partial{S}}{\partial{T}} \right)_V\mathrm{d}T + \left[ T \left( \frac{\partial{p}}{\partial{T}} \right)_V - p \right]\mathrm{d}V \tag{6.3}$$

再根据状态函数 $U=U(T,V)$ 本身的全微分形式，并结合式 (4.3) 的定容热容定义：
$$\mathrm{d}U = \left( \frac{\partial{U}}{\partial{T}} \right)_V\mathrm{d}T + \left(\frac{\partial{U}}{\partial{V}}\right)_T \mathrm{d}V = c_V\mathrm{d}T + \left(\frac{\partial{U}}{\partial{V}}\right)_T \mathrm{d}V \tag{6.4}$$

比较式 (6.3) 与式 (6.4) 的偏微分系数，可以清晰地解出对应的内在联系：
$$c_V = T\left( \frac{\partial{S}}{\partial{T}} \right)_V, \quad \left( \frac{\partial{U}}{\partial{V}} \right)_T = T \left( \frac{\partial{p}}{\partial{T}} \right)_V - p \tag{7.1}$$

此时，我们将**理想气体状态方程 (2.2)** 引入。由于考虑的是单位质量气体，将其变形为 $p = \frac{RT}{V}$ 并对 $T$ 求偏导：
$$\left( \frac{\partial{p}}{\partial{T}} \right)_V = \frac{R}{V}$$
将其带回至式 (7.1) 的内能体积偏导项中：

$$
\begin{aligned}
\left( \frac{\partial{U}}{\partial{V}} \right)_T &= T \cdot \left(\frac{R}{V}\right) - p \\\\
&= p - p = 0
\end{aligned} \tag{7.3}
$$

这在数学上严密证明了**理想气体的内能仅与温度相关，与体积无关**。因此理想气体的内能方程获得了极简的唯象表达：
$$\mathrm{d}U = c_V \mathrm{d}T \tag{7.4}$$

---

## 5. 迈耶公式的微分推导

根据热力学第一定律微分形式 (2.3) 变形，首先得到熵微元的表达式：
$$\mathrm{d}S = \frac{\mathrm{d}U + p\mathrm{d}V}{T} \tag{8.1}$$

将式 (6.3) 和式 (6.4) 融合后的内能关系代入式 (8.1) 中展开：

$$
\begin{aligned}
\mathrm{d}S &= \frac{c_V}{T}\mathrm{d}T + \frac{1}{T} \left[ T \left( \frac{\partial{p}}{\partial{T}} \right)_V - p + p \right]\mathrm{d}V \\\\
& = \frac{c_V}{T}\mathrm{d}T + \left( \frac{\partial{p}}{\partial{T}} \right)_V \mathrm{d}V
\end{aligned} \tag{8.2}
$$

另一方面，利用焓的微分形式 (4.1) 同样可以给出熵微元的另一种表达：
$$\mathrm{d}S = \frac{\mathrm{d}H - V\mathrm{d}p}{T} \tag{8.3}$$
已知理想气体的焓也满足 $\mathrm{d}H = c_p \mathrm{d}T$ (式 8.4)，代入上式得到：
$$\mathrm{d}S = \frac{c_p}{T}\mathrm{d}T - \frac{1}{T}V\mathrm{d}p \tag{9.1}$$

联立式 (8.2) 与式 (9.1) 两个完全对等的熵全微分式：
$$\frac{c_V}{T}\mathrm{d}T + \left( \frac{\partial{p}}{\partial{T}} \right)_V \mathrm{d}V = \frac{c_p}{T}\mathrm{d}T - \frac{1}{T}V\mathrm{d}p \tag{9.2}$$

为了求解两比热容的差值，我们强制选取一个**定压过程**条件（即 $\mathrm{d}p = 0$）。此时体积全微分退化为仅受温度控制的偏微分形式：$\mathrm{d}V = \left( \frac{\partial{V}}{\partial{T}} \right)_p\mathrm{d}T$。将其代入式 (9.2) 并移项整理：
$$c_p - c_V = T \left( \frac{\partial{p}}{\partial{T}} \right)_V \left( \frac{\partial{V}}{\partial{T}} \right)_p \tag{9.3}$$

最后，对单位质量理想气体，状态方程可写为 $p = \frac{1}{V}RT$ 与 $V = \frac{1}{p}RT$。对其分别求偏导：
$$\left( \frac{\partial{p}}{\partial{T}} \right)_V = \frac{R}{V} = \rho R, \quad \left( \frac{\partial{V}}{\partial{T}} \right)_p = \frac{R}{p}$$
代入式 (9.3)，可得：
$$c_p - c_V = T \cdot (\rho R) \cdot \left(\frac{R}{p}\right) = \frac{\rho RT}{p} \cdot R = 1 \cdot R \implies c_p - c_V = R \tag{9.4}$$

---

## 6. 构建大气热力学骨架

通过前面的繁琐推导，我们已经成功构筑了推进现代大气动力学所需的全部热力学基石：

1. **理想气体内能方程**：$\mathrm{d}U = c_V\mathrm{d}T$ (式 7.4)
2. **两比热容差（迈耶公式）**：$c_p - c_V = R$ (式 9.4)

接下来，我们将这些静止的唯象公式投入到流体连续介质的**拉格朗日视角（物质导数）**中。

### 6.1 大气经典热力学第一定律

从流体块的非绝热加热出发，宏观能量守恒表达为：
$$\delta Q = \mathrm{d}U + \delta W \tag{11.1}$$

代入理想气体内能方程以及利用状态方程变换体积功：

$$
\begin{aligned}
T\mathrm{d}S &= c_V\mathrm{d}T + p\mathrm{d}V \\\\
&= c_V\mathrm{d}T + p\left[ \frac{R}{p}\mathrm{d}T - \frac{RT}{p^2}\mathrm{d}p \right]\\\\
&= (c_V+R)\mathrm{d}T - \frac{1}{\rho}\mathrm{d}p \\\\
&= c_p\mathrm{d}T - \frac{1}{\rho}\mathrm{d}p
\end{aligned} \tag{11.2}
$$

在大气科学中，为了研究空间流体块的连续演变，我们需要将全微分向**时间物质导数**（Material Derivative, $\frac{\mathrm{D}}{\mathrm{D}t}$）演进：
$$T\frac{\mathrm{D}S}{\mathrm{D} t} = c_p\frac{\mathrm{D}T}{\mathrm{D} t} - \frac{1}{\rho} \frac{\mathrm{D}p}{\mathrm{D} t} \tag{11.3}$$
**这就是现代气象学与流体力学中应用最为广泛的、非绝热形式的大气热力学第一定律。**

---

## 7. 位温形式的演化

在实际观测中，气流由于地形抬升或下沉会发生剧烈的、由于气压改变引起的变温（阿留申机制）。为了获得一个剔除垂直气压层落高度干扰、真正反映物理本质守恒性的量，我们引入了**位温** ($\theta$)。

### 7.1 位温的物理定义（泊松方程）

位温是指将干空气块以绝热方式膨胀或压缩变换到设定的标准参考气压（通常取 $p_0 = 1000 \text{ hPa}$）时所具有的绝对温度：
$$\theta = T\left( \frac{p_0}{p} \right)^{R/c_p} \tag{12.1}$$

### 7.2 数学演进与全导数映射

为简化上式指数项，对式 (12.1) 两边取自然对数 $\ln$：
$$\ln \theta = \ln T + \frac{R}{c_p} \left( \ln p_0 - \ln p \right) \tag{12.2}$$

同样对其求随流线运动的时间物质导数：

$$
\begin{aligned}
\frac{\mathrm{D}\ln\theta}{\mathrm{D} t} &= \frac{\mathrm{D}\ln T}{\mathrm{D} t} - \frac{R}{c_p}\frac{\mathrm{D}\ln p}{\mathrm{D} t} \\\\
&= \frac{1}{T}\frac{\mathrm{D}T}{\mathrm{D} t} - \frac{R}{c_p} \cdot \frac{1}{p}\frac{\mathrm{D}p}{\mathrm{D} t}
\end{aligned}
$$

将状态方程 $\frac{R}{p} = \frac{1}{\rho T}$ 代入上式右端：
$$\frac{\mathrm{D}\ln\theta}{\mathrm{D} t} = \frac{1}{T}\frac{\mathrm{D}T}{\mathrm{D} t} - \frac{1}{c_p\rho T}\frac{\mathrm{D}p}{\mathrm{D} t} \tag{12.3}$$
移项整理，可以将流体块的绝对温度局地演变显式表达为：
$$\frac{\mathrm{D}T}{\mathrm{D} t} = T\frac{\mathrm{D}\ln\theta}{\mathrm{D} t} + \frac{1}{c_p\rho}\frac{\mathrm{D}p}{\mathrm{D} t} \tag{12.4}$$

### 7.3 位温形式热力学第一定律

将变形后的温度导数式 (12.4) 代回到大气的热力学第一定律标准式 (11.3) 中：
$$T\frac{\mathrm{D}S}{\mathrm{D} t} = c_p \left[ T\frac{\mathrm{D}\ln\theta}{\mathrm{D} t} + \frac{1}{c_p\rho}\frac{\mathrm{D}p}{\mathrm{D} t} \right] - \frac{1}{\rho}\frac{\mathrm{D}p}{\mathrm{D} t}$$
展开并消去相互拮抗的变压做功项：
$$T\frac{\mathrm{D}S}{\mathrm{D} t} = c_p T \frac{\mathrm{D}\ln\theta}{\mathrm{D} t} + \frac{1}{\rho}\frac{\mathrm{D}p}{\mathrm{D} t} - \frac{1}{\rho}\frac{\mathrm{D}p}{\mathrm{D} t}$$

最终，我们得到了优雅至极的**位温形式的大气热力学第一定律**：
$$T\frac{\mathrm{D}S}{\mathrm{D} t} = c_p\frac{\mathrm{D}\ln\theta}{\mathrm{D} t} \tag{13.2}$$

### 7.4 气象应用：干绝热位温守恒

对于中尺度及大尺度大气运动，在没有强烈辐射辐射、蒸发凝结潜热释放等非绝热加热时，流体过程可近似视为**干绝热过程**。

即 $\delta Q = 0 \implies T\mathrm{d}S = 0 \implies \frac{\mathrm{D}S}{\mathrm{D}t} = 0$。代入式 (13.2) 显然可以得出：
$$\frac{\mathrm{D}\ln\theta}{\mathrm{D} t} = 0 \implies \frac{\mathrm{D}\theta}{\mathrm{D} t} = 0$$

这就是气象学中威震天下的**位温守恒定律（保守性）**。它表明在干绝热大气中，无论气块由于波动剧烈上升还是下沉，其位温始终保持不变，这成为了追踪大气三维空间运动、定义气团属性以及分析斜压不稳定源的重要判据。
