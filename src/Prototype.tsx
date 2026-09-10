import { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, X, LockSimple, BookOpen, ChatsCircle, Compass, WechatLogo, CaretDown, Monitor, DeviceMobile, CircleNotch } from '@phosphor-icons/react';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { MobileScroll, BottomSheet, useKeyboardInsets } from './mobile';
import { questions, names, poles, calculate, sampleProfile, type Profile } from './personality';
import '@fontsource-variable/manrope';
import './prototype.css';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler);
type Screen = 'home'|'quiz'|'result'|'report';
type Overlay = 'about'|'payment'|'empty'|null;
const price = '6.9';
const choices = [{v:2,l:'非常符合'},{v:1,l:'比较符合'},{v:0,l:'说不准'},{v:-1,l:'不太符合'},{v:-2,l:'很不符合'}];

function Radar({profile}: {profile:Profile}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(!ref.current) return;
    const c=new Chart(ref.current,{type:'radar',data:{labels:profile.type.split('').map(l=>`${poles[l].label} ${l}`),datasets:[{data:profile.values,backgroundColor:'rgba(218,165,126,0.14)',borderColor:'#c49473',borderWidth:1.4,pointRadius:2,pointBackgroundColor:'#c49473'}]},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},scales:{r:{min:0,max:100,ticks:{display:false,stepSize:25},grid:{circular:true,color:'#d6dee0'},angleLines:{color:'#d6dee0'},pointLabels:{color:'#303a3d',font:{size:12,family:'Manrope Variable, PingFang SC, sans-serif'}}}}}});
    return ()=>c.destroy();
  },[profile]);
  return <div className="radar"><canvas ref={ref} role="img" aria-label={profile.type.split('').map((l,i)=>`${poles[l].label}偏好 ${profile.values[i]}%`).join('，')}/></div>;
}
function Primary({children,onClick,disabled=false,light=false}: {children:ReactNode;onClick:()=>void;disabled?:boolean;light?:boolean}) {
  return <button className={`primary ${light?'light':''}`} onClick={onClick} disabled={disabled}>{children}<ArrowUpRight size={19} weight="light"/></button>;
}
function PhoneDock({children}: {children:ReactNode}) {
  const {bottomInset}=useKeyboardInsets();
  return <div className="app-dock" style={{bottom:bottomInset}}>{children}</div>;
}
function Sheet({phone,overlay,close,children,title,description}:{phone:boolean;overlay:Overlay;close:()=>void;children:ReactNode;title:string;description:string}) {
  if(phone) return <BottomSheet open={!!overlay} onOpenChange={open=>!open&&close()} title={title} description={description} snap={0.84}><button className="sheet-close icon-button" onClick={close} aria-label="关闭"><X size={20}/></button>{children}</BottomSheet>;
  return <Dialog.Root open={!!overlay} onOpenChange={open=>!open&&close()}><Dialog.Portal><Dialog.Overlay className="web-overlay"/><Dialog.Content className="web-modal"><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description><button className="sheet-close icon-button" onClick={close} aria-label="关闭"><X size={20}/></button>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function Experience({phone=false}: {phone?:boolean}) {
  const appRef=useRef<HTMLDivElement>(null);
  const [compact,setCompact]=useState(()=>phone || window.innerWidth<=720);
  useEffect(()=>{const media=window.matchMedia('(max-width:720px)');const update=()=>setCompact(phone||media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[phone]);
  const [screen,setScreen]=useState<Screen>('home');
  const [overlay,setOverlay]=useState<Overlay>(null);
  const [answers,setAnswers]=useState<(number|undefined)[]>(Array(questions.length).fill(undefined));
  const [index,setIndex]=useState(0);
  const [profile,setProfile]=useState<Profile>(sampleProfile);
  const [sample,setSample]=useState(true);
  const [completed,setCompleted]=useState(false);
  const [unlocked,setUnlocked]=useState(false);
  const [payState,setPayState]=useState<'ready'|'processing'|'success'|'cancelled'>('ready');
  const [chapter,setChapter]=useState(0);
  const [strength,setStrength]=useState(true);
  const [faq,setFaq]=useState<number|null>(0);
  const [toast,setToast]=useState('');
  const [previewMenu,setPreviewMenu]=useState(false);
  useEffect(()=>{if(phone)appRef.current?.closest<HTMLElement>('[data-phone-screen]')?.scrollTo({top:0,left:0});},[phone,screen,chapter,overlay]);
  const [name,line,summary]=names[profile.type];
  const letters=profile.type.split('');
  const answered=answers.filter(a=>a!==undefined).length;
  const transition=(s:Screen)=>{setScreen(s);setOverlay(null);window.scrollTo({top:0});};
  const start=()=>transition('quiz');
  const preview=()=>{setProfile(sampleProfile);setSample(true);transition('result');};
  const myReport=()=>{if(completed){setProfile(calculate(answers as number[]));setSample(false);transition(unlocked?'report':'result');}else setOverlay('empty');};
  const openPay=()=>{setPayState('ready');setOverlay('payment');};
  const next=()=>{
    if(answers[index]===undefined)return;
    if(index<questions.length-1)setIndex(index+1);
    else {setProfile(calculate(answers as number[]));setSample(false);setCompleted(true);setUnlocked(false);setChapter(0);transition('result');}
  };
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2500);return()=>clearTimeout(t);},[toast]);
  useEffect(()=>{if(payState!=='processing')return;const t=setTimeout(()=>{setPayState('success');setUnlocked(true);},900);return()=>clearTimeout(t);},[payState]);
  const showReport=()=>{setChapter(0);transition('report');};
  const header=<header className={`app-header ${screen==='home'?'home-header':''}`}>
    {screen==='home'?<button className="brand" onClick={()=>transition('home')} aria-label="观己首页">mirror<span>观己</span></button>:<button className="back-button" onClick={()=>transition(screen==='report'?'result':'home')}><ArrowLeft size={19} weight="light"/><span>{screen==='quiz'?'认识自己':screen==='result'?'你的性格画像':'完整人格报告'}</span></button>}
    <nav className="desktop-nav" aria-label="主导航"><button className={screen==='quiz'?'active':''} onClick={start}>人格测试</button><button onClick={()=>setOverlay('about')}>了解测试</button><button onClick={myReport}>我的报告<ArrowUpRight size={14}/></button></nav>
    <button className="mobile-header-action" onClick={()=>screen==='home'?myReport():setOverlay('about')}>{screen==='home'?'我的报告':'测试说明'}</button>
  </header>;
  const home=<main className="home-content">
    <section className="home-hero">
      <div className="hero-image"><img src="/assets/mirror/portrait.png" alt="冷灰色光线下，闭眼沉思的女性侧脸"/><div className="image-caption"><span>THE WORLD WITHIN.</span><span>从这里，靠近自己。</span></div></div>
      <div className="hero-copy"><p className="eyebrow">A LITTLE CLOSER TO YOU</p><h1>向内看见，<br/>真实的自己<span className="title-dot">。</span></h1><p className="hero-description">你如何感受世界、与人相处、做出选择？<br/>给自己几分钟，从另一个角度认识自己。</p>
        <div className="hero-meta"><span>32 <small>道情境题</small></span><span>5 <small>分钟左右</small></span><span>16 <small>种人格倾向</small></span></div>
        <div className="desktop-hero-actions"><Primary onClick={start}>{answered>0&&!completed?'继续认识自己':'开始认识自己'}</Primary><button className="text-link" onClick={preview}>先看看报告 <ArrowUpRight size={16}/></button><p className="price-note">免费测试与性格概览 · 完整报告 ¥{price} / 次</p></div>
      </div>
      <p className="hero-footnote">没有标准答案，只有更真实的你。</p>
    </section>
    <section className="home-bottom"><span>SELF-DISCOVERY, AT YOUR PACE.</span><div><b>01</b> 感受自己</div><div><b>02</b> 理解偏好</div><div><b>03</b> 找到相处方式</div><button onClick={()=>setOverlay('about')}>关于这次探索 <ArrowUpRight size={15}/></button></section>
  </main>;
  const quiz=<main className="quiz-content">
    <aside className="quiz-aside"><p className="eyebrow">DISCOVER YOUR TYPE</p><h1>不必成为谁。<br/>只要是你自己。</h1><p>回想最近一段时间的日常，<br/>选择最接近真实状态的答案。</p><div className="quiz-index"><strong>{String(index+1).padStart(2,'0')}</strong><span> / {questions.length}</span></div><p className="aside-foot">跟随第一感觉，也可以返回修改。</p></aside>
    <section className="question-panel"><div className="progress-label"><span>{String(index+1).padStart(2,'0')} <small>/ {questions.length}</small></span><span>已完成 {Math.round(answered/questions.length*100)}%</span></div><progress className="quiz-progress" value={answered} max={questions.length} aria-label="测试完成进度"/>
      <div className="question-block" key={index}><p className="eyebrow">跟随你的第一感觉</p><h2 id="question-title">{questions[index].text}</h2><div className="answer-options" role="group" aria-labelledby="question-title">{choices.map(({v,l})=><button key={v} className={`answer-option ${answers[index]===v?'selected':''}`} aria-pressed={answers[index]===v} onClick={()=>{const a=[...answers];a[index]=v;setAnswers(a);}}><span>{l}</span><span className="choice-mark">{answers[index]===v&&<Check size={15}/>}</span></button>)}</div></div>
      <p className="question-hint">没有好坏之分，选择符合日常的你。</p>
      <div className="desktop-question-actions"><button className="back-button" disabled={index===0} onClick={()=>setIndex(index-1)}><ArrowLeft size={17}/>上一题</button><Primary disabled={answers[index]===undefined} onClick={next}>{index===questions.length-1?'查看我的结果':'下一题'}</Primary></div>
    </section>
  </main>;
  const typeIntro=<div className="type-intro"><p className="eyebrow">{sample?'SAMPLE REPORT · 示例报告':'YOUR PERSONALITY · 你的性格画像'}</p><div className="type-word">{profile.type}<span>{name}</span></div><h1>{line}</h1><p className="type-description">{summary}</p><div className="type-tags">{letters.slice(0,3).map(l=><span key={l}>{poles[l].label}倾向</span>)}</div>{profile.balanced.some(Boolean)&&<p className="balanced-note">部分维度接近均衡，字母只描述这次作答中的倾向。</p>}</div>;
  const result=<main className="result-content"><section className="result-overview">{typeIntro}<div className="result-chart"><div className="section-label"><span>四个维度，认识你的偏好</span><span>01 — 04</span></div><Radar profile={profile}/><div className="dimension-mini">{letters.map((l,i)=><div key={l}><span>{poles[l].label}</span><strong>{profile.values[i]}<small>%</small></strong></div>)}</div><p className="chart-note">百分比表示本次作答的偏好强度，无优劣之分。</p></div></section>
    <section className="unlock-panel"><div><p className="eyebrow">THERE IS MORE TO YOU</p><h2>四个字母，<br/>只是故事的开始。</h2><p>理解自己的优势，也看见那些容易忽略的部分。</p></div><div className="unlock-details"><ul><li><BookOpen size={20} weight="light"/><span>核心性格与优势盲点</span></li><li><ChatsCircle size={20} weight="light"/><span>亲密关系与沟通方式</span></li><li><Compass size={20} weight="light"/><span>工作偏好与成长建议</span></li></ul><div className="unlock-price"><strong><small>¥</small>{price}</strong><span>一次解锁完整报告<br/>无订阅 · 无自动续费</span></div><Primary onClick={unlocked?showReport:openPay} light>{unlocked?'阅读完整报告':'解锁完整报告'}</Primary><p className="secure-note"><LockSimple size={12}/>微信支付 · 支付前可再次确认</p></div></section>
    <p className="report-note">认识自己是一段持续的旅程。这份画像用于自我探索，不定义你。</p>
  </main>;
  const chapterLabels=['性格总览','优势与盲点','关系与沟通','工作与成长'];
  const report=<main className="report-content"><aside className="report-sidebar"><p className="eyebrow">YOUR INNER WORLD</p><div className="report-type">{profile.type}</div><p>{name} · {sample?'示例':'本次'}人格报告</p><span className="unlocked-badge"><Check size={12}/>已解锁 · 演示</span><nav aria-label="报告章节">{chapterLabels.map((l,i)=><button key={l} className={chapter===i?'active':''} onClick={()=>setChapter(i)}><span>0{i+1}</span>{l}<ArrowUpRight size={15}/></button>)}</nav><p className="sidebar-footer">YOU ARE MORE<br/>THAN FOUR LETTERS.</p></aside>
    <article className="report-article" key={chapter}><div className="report-mobile-heading"><span>{profile.type} · {name}</span><span>完整报告 · 演示</span></div><div className="mobile-chapters" role="tablist" aria-label="报告章节">{chapterLabels.map((l,i)=><button role="tab" aria-selected={chapter===i} key={l} onClick={()=>setChapter(i)}>{l}</button>)}</div><div className="article-label"><span>CHAPTER 0{chapter+1}</span><span>{profile.type}</span></div>
      {chapter===0?<><h1>{line}</h1><p className="article-lead">{summary}</p><div className="report-chart-block"><Radar profile={profile}/><div className="dimension-list">{letters.map((l,i)=><div key={l}><div><b>{poles[l].label} <small>{l}</small></b><span>{profile.values[i]}%</span></div><progress value={profile.values[i]} max={100} aria-label={`${poles[l].label} ${profile.values[i]}%`}/><p>{poles[l].need}{profile.balanced[i]?' · 偏好接近均衡':''}</p></div>)}</div></div><blockquote>你不需要符合一个类型，<br/>你只需要更了解自己。</blockquote><p>这些倾向来自你本次的回答。环境、角色和最近的经历，都可能影响你的表达方式。把它当作观察自己的起点，看看哪些描述与你的生活相呼应。</p></>:chapter===1?<><h1>理解你的优势，<br/>也温柔地看见盲点。</h1><div className="segmented" role="tablist" aria-label="优势与盲点"><button role="tab" aria-selected={strength} onClick={()=>setStrength(true)}>你的优势</button><button role="tab" aria-selected={!strength} onClick={()=>setStrength(false)}>容易忽略的</button></div>{letters.map((l,i)=><section className="insight" key={l}><span>0{i+1}</span><div><h3>{strength?poles[l].need:['精力的边界','视角的边界','决策的边界','节奏的边界'][i]}</h3><p>{strength?poles[l].strength:poles[l].growth}</p></div></section>)}<blockquote>优势不需要时时在线。<br/>适合自己的节奏，同样重要。</blockquote></>:chapter===2?<><h1>好的关系，<br/>从被理解开始。</h1><p className="article-lead">把“你应该懂我”，换成一次更具体的表达。你的偏好值得被看见，对方的也一样。</p><section className="insight"><span>01</span><div><h3>让精力的需要变得可见</h3><p>{letters[0]==='I'?'你可能需要独处来恢复精力。提前告诉对方“我想安静一会儿，晚饭后再聊”，比突然沉默更容易被理解。':'你可能通过交谈整理感受。先问对方现在是否方便，再分享你想讨论的内容，为彼此的精力留出空间。'}</p></div></section><section className="insight"><span>02</span><div><h3>先确认对方需要什么</h3><p>{letters[2]==='F'?'你很容易注意到对方的情绪，但不需要替对方承担所有感受。倾听之后，可以问：“你希望我接下来怎么陪你？”':'你可能很快看见解决问题的办法。在给建议之前，先回应对方的感受，会让你的分析更容易被接住。'}</p></div></section><blockquote>“这件事让我感到……<br/>我希望我们可以……”</blockquote><p>试着在一次小分歧中使用这句话。描述具体情境和自己的需要，避免用人格标签解释对方的一切。</p></>:<><h1>找到适合你的方式，<br/>让成长具体一点。</h1><p className="article-lead">与其用人格类型决定职业，不如观察：什么环境能让你稳定发挥，什么习惯值得调整。</p><section className="insight"><span>01</span><div><h3>适合你的工作节奏</h3><p>{letters[0]==='I'?'为需要专注的任务留出不被打断的时间，再安排集中交流。':'通过定期讨论保持进展，同时为独立思考安排完整时段。'}{letters[3]==='J'?'清晰的目标和节点会让你更安心，也别忘了为变化留一点余地。':'灵活的任务安排能激发你的主动性，重要节点仍需要提前约定。'}</p></div></section><section className="insight"><span>02</span><div><h3>这一周，试着做一件小事</h3><p>{poles[letters[2]].growth}</p></div></section><div className="practice"><p className="eyebrow">A SMALL STEP THIS WEEK</p><h3>记录一次让你感到<br/>“这很像我”的时刻。</h3><p>当时你在做什么？和谁在一起？<br/>哪一个需要被满足了？</p></div><p>一周后再回看这段记录。真实的生活体验，比任何四个字母都更能帮助你理解自己。</p></>}
      <div className="article-next">{chapter<3?<button className="text-link" onClick={()=>setChapter(chapter+1)}>下一章 · {chapterLabels[chapter+1]}<ArrowRight size={17}/></button>:<button className="text-link" onClick={()=>transition('home')}>带着新的理解，回到生活<ArrowUpRight size={17}/></button>}</div>
    </article></main>;
  const payContent=payState==='success'?<div className="pay-success"><Check size={44} weight="light"/><p className="eyebrow">READY FOR YOU</p><h3>你的完整报告，<br/>已经准备好了。</h3><p>演示解锁成功，本次未产生扣款。</p><Primary onClick={showReport}>开始阅读报告</Primary></div>:<div className="payment-content"><div className="payment-summary"><span>{profile.type} · {name}<small>完整人格分析报告</small></span><strong><small>¥</small>{price}</strong></div><ul className="payment-list">{['性格画像与四维偏好','优势、盲点与关系沟通','工作方式与可实践的成长建议'].map(l=><li key={l}><Check size={15}/>{l}</li>)}</ul><div className="payment-method"><WechatLogo size={25} weight="fill"/><span>{compact?'微信支付':'微信扫码支付'}<small>{compact?'在微信内确认支付':'使用手机微信完成支付'}</small></span><Check size={17}/></div><p className="payment-demo">支付演示 · 本次不会扣款</p>{payState==='cancelled'&&<p role="status" className="payment-cancelled">支付已取消。你的测试结果仍可查看。</p>}<button className="primary pay-button" disabled={payState==='processing'} onClick={()=>setPayState('processing')}>{payState==='processing'?<><CircleNotch className="spin" size={20}/>正在演示解锁…</>:<>模拟支付 ¥{price}<ArrowUpRight size={18}/></>}</button><button className="cancel-payment" onClick={()=>{if(payState==='processing')setPayState('cancelled');else {setPayState('cancelled');setOverlay(null);setToast('支付已取消，测试结果已保留');}}}>暂不支付</button><p className="payment-terms">单次购买 · 无自动续费</p></div>;
  const faqs=[['测试需要多久？','共 32 道日常情境题，通常约 5 分钟。选择最符合你最近状态的答案，每道题都可以返回修改。'],['哪些内容需要付费？',`测试、人格类型与简短概览免费。完整报告为 ¥${price} 一次性解锁，包含优势盲点、关系沟通和成长建议，无订阅、无自动续费。`],['结果能定义我吗？','不能。人格偏好会随情境和经历有所变化，结果用于自我探索，不用于诊断、招聘筛选或给他人贴标签。'],['这是官方 MBTI 测评吗？','这是参考四维人格偏好设计的独立体验，采用原创演示题目，并非官方 MBTI 量表。']];
  const aboutContent=<div className="about-content"><p className="about-intro">认识自己，不是把自己放进一个盒子。<br/>是多一种理解自己的语言。</p>{faqs.map(([q,a],i)=><div className="faq" key={q}><button aria-expanded={faq===i} onClick={()=>setFaq(faq===i?null:i)}>{q}<CaretDown className={faq===i?'rotated':''} size={17}/></button>{faq===i&&<p>{a}</p>}</div>)}<Primary onClick={()=>{setOverlay(null);start();}}>开始认识自己</Primary></div>;
  let dock:ReactNode=null;
  if(screen==='home')dock=<><Primary onClick={start}>{answered>0&&!completed?'继续认识自己':'开始认识自己'}</Primary><div className="home-dock-note"><span>免费测试 · 完整报告 ¥{price}</span><button onClick={preview}>报告示例<ArrowUpRight size={12}/></button></div></>;
  if(screen==='quiz')dock=<div className="quiz-dock"><button disabled={index===0} onClick={()=>setIndex(index-1)} className="back-button"><ArrowLeft size={17}/>上一题</button><Primary disabled={answers[index]===undefined} onClick={next}>{index===questions.length-1?'查看结果':'下一题'}</Primary></div>;
  if(screen==='result')dock=<div className="result-dock"><div><small>完整人格报告</small><strong>¥{price}<span> / 次</span></strong></div><Primary onClick={unlocked?showReport:openPay}>{unlocked?'阅读报告':'解锁完整报告'}</Primary></div>;
  const content=screen==='home'?home:screen==='quiz'?quiz:screen==='result'?result:report;
  return <div ref={appRef} className={`mirror-app ${phone?'phone-experience':'web-experience'} screen-${screen}`}>
    {header}{phone?<MobileScroll key={screen+String(chapter)} className={`experience-scroll state-${screen}`}>{content}</MobileScroll>:<div className="web-scroll" key={screen+String(chapter)}>{content}</div>}
    {dock&&(phone?<PhoneDock>{dock}</PhoneDock>:<div className="web-mobile-dock">{dock}</div>)}
    <Sheet phone={phone} overlay={overlay} close={()=>{setOverlay(null);if(payState==='processing')setPayState('cancelled');}} title={overlay==='payment'?'更完整地，认识自己。':overlay==='empty'?'属于你的故事，还未开始。':'关于这次探索'} description={overlay==='payment'?'完整人格分析 · 一次解锁':overlay==='empty'?'完成测试后，在这里找回本次的性格报告。':'按照自己的节奏，回答每一道题。'}>{overlay==='payment'?payContent:overlay==='empty'?<div className="empty-report"><BookOpen size={44} weight="thin"/><p>你还没有完成测试。<br/>从 32 个日常片段，认识真实的自己。</p><Primary onClick={start}>开始测试</Primary><button className="text-link" onClick={preview}>先看看报告示例<ArrowUpRight size={16}/></button></div>:aboutContent}</Sheet>
    {toast&&<div className="toast" role="status">{toast}</div>}
    {!phone&&<div className="preview-switch"><button onClick={()=>setPreviewMenu(!previewMenu)} aria-expanded={previewMenu}><Monitor size={15}/>电脑端预览<CaretDown size={12}/></button>{previewMenu&&<a href="/"><DeviceMobile size={16}/>切换手机端预览</a>}</div>}
  </div>;
}
export default function Prototype(){return <><Experience phone/>{createPortal(<div className="mobile-preview-caption"><span>MIRROR / 观己</span><p>一次向内的探索。</p><a href="/web.html"><Monitor size={16}/>查看电脑端设计<ArrowUpRight size={14}/></a></div>,document.body)}</>;}
