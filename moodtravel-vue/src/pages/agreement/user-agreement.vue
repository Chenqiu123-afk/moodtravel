<template>
  <div class="agreement-page" :style="{ background: pageBg }">
    <!-- ============================================================ -->
    <!-- 顶部导航 -->
    <!-- ============================================================ -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <div class="header-center">
        <span class="header-title">用户协议</span>
        <span class="header-sub">MoodTravel 服务条款</span>
      </div>
      <div class="header-right" />
    </div>

    <!-- ============================================================ -->
    <!-- 协议内容 -->
    <!-- ============================================================ -->
    <div class="agreement-content">
      <div class="update-date">
        <span>更新日期：2024年7月1日</span>
        <span>生效日期：2024年7月1日</span>
      </div>

      <p class="agreement-intro">
        欢迎使用 MoodTravel（情绪旅行）平台。请您仔细阅读以下条款，使用本平台即表示您同意本协议的全部内容。
      </p>

      <!-- 第一条：服务说明 -->
      <div class="clause">
        <h3 class="clause-title">一、服务说明</h3>
        <p class="clause-text">
          MoodTravel 是一个基于情绪状态与个人偏好，为用户提供个性化旅行规划、治愈空间推荐、商家预订服务及<b>情绪陪伴</b>的平台。本平台通过 AI 算法分析用户的情绪状态、MBTI 人格、出行偏好及实际约束条件，生成定制化的旅行方案与情绪支持内容。
        </p>
        <p class="clause-text">
          <strong>重要提示：</strong>本平台提供的情绪支持内容（包括但不限于情绪记录、暖心话术、推荐信息）仅为旅行辅助和情绪陪伴目的，<b>不构成心理咨询、诊断或治疗</b>。所有涉及医疗、心理健康的内容均指向合规专业资源。
        </p>
      </div>

      <!-- 第二条：用户账户 -->
      <div class="clause">
        <h3 class="clause-title">二、用户账户</h3>
        <p class="clause-text">
          2.1 用户在使用本平台服务前需完成账户注册。用户应提供真实、准确、完整的个人信息，并在信息变更时及时更新。
        </p>
        <p class="clause-text">
          2.2 用户应对其账户下的所有活动负责，不得将账户转让、出借或与他人共享。
        </p>
        <p class="clause-text">
          2.3 用户有权随时注销账户，注销后平台将按照本协议第七条的数据匿名化条款处理相关数据。
        </p>
      </div>

      <!-- 第三条：认证商家 -->
      <div class="clause">
        <h3 class="clause-title">三、认证商家</h3>
        <p class="clause-text">
          3.1 平台展示的「认证商家」均已通过 MoodTravel 认证计划审核，包括但不限于实名认证、品质保障、安全合规等标准。
        </p>
        <p class="clause-text">
          3.2 认证商家的认证编号、认证等级及通过的标准项将在商家详情页中公开展示，用户可据此判断商家的可信度。
        </p>
        <p class="clause-text">
          3.3 平台与认证商家之间采用透明分成模式，具体分成比例在商家入驻协议中明确约定。
        </p>
      </div>

      <!-- 第四条：订单与支付 -->
      <div class="clause">
        <h3 class="clause-title">四、订单与支付</h3>
        <p class="clause-text">
          4.1 用户在平台预订商品/服务时，订单确认页面将明确展示原价、平台价、平台服务费及商家分成信息。
        </p>
        <p class="clause-text">
          4.2 平台收取2%的服务费用于支付通道维护及用户权益保障。商家分成比例根据品类不同在8%-15%之间浮动。
        </p>
        <p class="clause-text">
          4.3 用户支付成功后，平台将通过模拟支付回调确认订单状态，并在订单详情中展示结算信息。
        </p>
      </div>

      <!-- 第五条：UGC内容与CC0协议 -->
      <div class="clause">
        <h3 class="clause-title">五、UGC 内容与 CC0 协议</h3>
        <p class="clause-text">
          5.1 用户通过平台上传的原创内容（包括但不限于文字、图片、地点信息），可选择以 CC0 1.0 通用公共领域贡献协议发布。
        </p>
        <p class="clause-text">
          5.2 选择 CC0 协议的用户，即表示自愿放弃该内容的版权及相关权利，将其贡献至公共领域，允许任何人自由使用、修改和分发，包括商业用途。
        </p>
        <p class="clause-text">
          5.3 用户需确保上传内容为原创，不侵犯任何第三方的知识产权、肖像权、隐私权等合法权益。
        </p>
      </div>

      <!-- 第六条：隐私保护 -->
      <div class="clause">
        <h3 class="clause-title">六、隐私保护</h3>
        <p class="clause-text">
          6.1 平台重视用户隐私保护，仅在提供服务所必需的范围内收集和使用用户个人信息。
        </p>
        <p class="clause-text">
          6.2 平台不会在未经用户明确同意的情况下，向第三方提供用户的个人身份信息。
        </p>
        <p class="clause-text">
          6.3 用户可在「我的」页面查看和管理个人数据授权范围。
        </p>
      </div>

      <!-- 第七条：数据匿名化条款（新增） -->
      <div class="clause highlight-clause">
        <div class="clause-badge">
          <span class="clause-badge-icon">🔒</span>
          <span class="clause-badge-text">新增条款</span>
        </div>
        <h3 class="clause-title">七、数据匿名化处理</h3>
        <p class="clause-text">
          7.1 <strong>匿名化原则：</strong>平台承诺对用户数据进行匿名化处理，确保数据在分析、展示和共享过程中无法直接或间接识别特定自然人身份。
        </p>
        <p class="clause-text">
          7.2 <strong>匿名化范围：</strong>以下数据将在平台公开展示前进行匿名化处理：
        </p>
        <ul class="clause-list">
          <li>用户上传的UGC内容中的个人身份信息（姓名、手机号、身份证号等）；</li>
          <li>用户评价和评论中可能含有的个人信息；</li>
          <li>用户分享的行程和地点信息中的关联个人信息。</li>
        </ul>
        <p class="clause-text">
          7.3 <strong>匿名化技术措施：</strong>平台采用以下技术手段确保数据匿名化效果：
        </p>
        <ul class="clause-list">
          <li><strong>脱敏处理：</strong>对姓名、手机号等敏感字段进行脱敏替换（如：张**，138****1234）；</li>
          <li><strong>聚合统计：</strong>涉及统计报告的数据使用聚合值，不展示个体数据；</li>
          <li><strong>差分隐私：</strong>在数据分析和模型训练中引入随机噪声，防止通过查询结果反推个体信息。</li>
        </ul>
        <p class="clause-text">
          7.4 <strong>例外情况：</strong>仅在以下情形中，平台可能保留未匿名化的数据：
        </p>
        <ul class="clause-list">
          <li>法律法规要求披露的；</li>
          <li>用户明确授权公开的；</li>
          <li>为保护用户或其他个人的生命、财产等重大合法权益所必需的。</li>
        </ul>
        <p class="clause-text">
          7.5 <strong>用户权利：</strong>用户有权随时要求平台提供其个人数据的匿名化处理报告，并有权要求删除其个人数据（法律另有规定的除外）。
        </p>
      </div>

      <!-- 第八条：情绪数据保护（新增） -->
      <div class="clause highlight-clause">
        <div class="clause-badge">
          <span class="clause-badge-icon">🔒</span>
          <span class="clause-badge-text">新增条款</span>
        </div>
        <h3 class="clause-title">八、情绪数据保护与心理健康合规</h3>
        <p class="clause-text">
          8.1 <strong>情绪数据加密存储：</strong>平台对用户情绪记录、心理测评结果等敏感数据采用 AES-256 加密存储，确保数据在传输和存储过程中的安全性。
        </p>
        <p class="clause-text">
          8.2 <strong>数据使用限制：</strong>情绪数据仅用于个性化推荐与服务优化，不会用于任何形式的用户画像售卖或第三方广告投放。
        </p>
        <p class="clause-text">
          8.3 <strong>心理健康合规声明：</strong>
        </p>
        <ul class="clause-list">
          <li>本平台<b>不是</b>心理咨询平台，不提供任何形式的心理诊断、治疗或危机干预服务；</li>
          <li>所有涉及心理健康的内容（包括情绪支持话术、资源推荐等）仅指向合规专业资源；</li>
          <li>如用户表现出严重情绪困扰迹象，平台将主动引导用户寻求专业帮助；</li>
          <li>平台不承担因用户依赖平台情绪支持内容而导致的任何后果。</li>
        </ul>
        <p class="clause-text">
          8.4 <strong>紧急情况：</strong>如果您或身边的人正在经历心理危机，请立即拨打全国心理援助热线 400-161-9995，或拨打 110 / 120 寻求紧急帮助。
        </p>
      </div>

      <!-- 第九条：免责声明 -->
      <div class="clause">
        <h3 class="clause-title">九、免责声明</h3>
        <p class="clause-text">
          9.1 平台提供的旅行规划方案为 AI 算法生成的推荐内容，仅供参考，不构成任何形式的承诺或保证。
        </p>
        <p class="clause-text">
          9.2 平台展示的商家信息、价格信息由商家提供，平台尽力确保信息准确，但不对其完全准确性承担责任。
        </p>
        <p class="clause-text">
          9.3 因不可抗力（自然灾害、政策变化等）导致的服务中断或信息偏差，平台不承担责任。
        </p>
      </div>

      <!-- 第十条：协议变更 -->
      <div class="clause">
        <h3 class="clause-title">十、协议变更</h3>
        <p class="clause-text">
          10.1 平台有权根据法律法规变化或业务发展需要修改本协议，修改后的协议将在平台公示。
        </p>
        <p class="clause-text">
          10.2 如用户不同意修改后的协议，有权停止使用平台服务；继续使用则视为同意修改后的协议。
        </p>
      </div>

      <div class="agreement-footer">
        <span>MoodTravel · 情绪旅行</span>
        <span>让每一次出行都治愈心灵</span>
      </div>
    </div>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'

const router = useRouter()
const store = useTravelStore()
const theme = computed(() => store.activeTheme)
const pageBg = computed(() => theme.value.bg)

function goBack() {
  router.back()
}
</script>

<style scoped>
.agreement-page {
  min-height: 100vh;
  padding: 0 16px;
  transition: background 0.5s ease;
}

/* ===== 顶部导航 ===== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 44px 0 16px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

@media (min-width: 768px) {
  .back-btn {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

.back-arrow {
  font-size: 18px;
  color: #555;
  font-weight: 600;
}

.header-center {
  text-align: center;
}

.header-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  display: block;
}

.header-sub {
  font-size: 11px;
  color: var(--color-text-light);
  font-weight: 600;
  margin-top: 2px;
  display: block;
}

.header-right {
  width: 36px;
}

/* ===== 协议内容 ===== */
.agreement-content {
  padding-bottom: 16px;
}

.update-date {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-light);
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #F5F2ED;
  border-radius: 8px;
}

.agreement-intro {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.8;
  margin: 0 0 20px;
  font-weight: 400;
}

/* 条款 */
.clause {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255,255,255,0.6);
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.04);
}

.clause.highlight-clause {
  background: linear-gradient(135deg, #F8FFF0, #F2FDE8);
  border: 1px solid #8BA88C30;
}

.clause-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: #8BA88C20;
  border-radius: 10px;
  margin-bottom: 8px;
}

.clause-badge-icon {
  font-size: 12px;
}

.clause-badge-text {
  font-size: 10px;
  font-weight: 700;
  color: #8BA88C;
}

.clause-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.clause-text {
  font-size: 13px;
  color: #555;
  line-height: 1.8;
  margin: 0 0 8px;
}

.clause-text:last-child {
  margin-bottom: 0;
}

.clause-list {
  margin: 0 0 8px;
  padding-left: 18px;
}

.clause-list li {
  font-size: 13px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 4px;
}

/* 协议底部 */
.agreement-footer {
  text-align: center;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.agreement-footer span:first-child {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.agreement-footer span:last-child {
  font-size: 12px;
  color: var(--color-text-light);
  font-weight: 400;
}

.safe-bottom {
  height: 40px;
}
</style>