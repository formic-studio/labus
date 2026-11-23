function e(e,t){let n=e.querySelector(`[data-header-logo]`),r=e.querySelector(`details[data-header-menu]`),i=r?.querySelector(`summary`);if(!n||!(r instanceof HTMLDetailsElement)||!i)return;let a=document.createElement(`span`);a.className=`site-header-menu-icon`,a.setAttribute(`aria-hidden`,`true`),a.innerHTML=`<svg data-menu-icon="mobile" preserveAspectRatio="none" overflow="visible" width="31.4144" height="33.8851" viewBox="0 0 31.4144 33.8851" fill="none" xmlns="http://www.w3.org/2000/svg">
<g>
<path data-menu-line="bottom" d="M31.4144 26.3094V33.3775H10.2099V26.3094H31.4144Z" fill="currentColor"/>
<path data-menu-line="top" d="M31.4144 0.392677V7.46086H10.2099V0.392677H31.4144Z" fill="currentColor"/>
<path d="M31.4144 13.7437V20.8119H10.2099V13.7437H31.4144Z" fill="currentColor"/>
<path data-menu-dot="" d="M3.92705 26.0316C6.11871 26.0316 7.85382 27.7993 7.85382 29.9383C7.85382 32.0772 6.11871 33.8851 3.92705 33.8851C1.73539 33.8851 0.000281214 32.1159 0.000281214 29.9383C0.000281214 27.7606 1.77774 26.0316 3.92705 26.0316Z" fill="currentColor"/>
<path data-menu-dot="" d="M3.92695 0.114892C6.11861 0.114892 7.85372 1.8826 7.85372 4.02158C7.85372 6.16056 6.11861 7.96843 3.92695 7.96843C1.73529 7.96843 0.000178954 6.19926 0.000178954 4.02158C0.000178954 1.84391 1.77764 0.114892 3.92695 0.114892Z" fill="currentColor"/>
<path data-menu-dot="" d="M3.92705 13.4659C6.11871 13.4659 7.85382 15.2336 7.85382 17.3726C7.85382 19.5116 6.11871 21.3194 3.92705 21.3194C1.73539 21.3194 0.000281214 19.5503 0.000281214 17.3726C0.000281214 15.1949 1.77774 13.4659 3.92705 13.4659Z" fill="currentColor"/>
</g>
</svg>
<svg data-menu-icon="desktop" preserveAspectRatio="none" overflow="visible" width="55.8145" height="60" viewBox="0 0 55.8145 60" fill="none" xmlns="http://www.w3.org/2000/svg">
<g>
<path data-menu-line="bottom" d="M55.8145 46.7442V59.3023H18.14V46.7442H55.8145Z" fill="currentColor"/>
<path data-menu-line="top" d="M55.8145 0.697674V13.2558H18.14V0.697674H55.8145Z" fill="currentColor"/>
<path d="M55.8145 24.4186V36.9767H18.14V24.4186H55.8145Z" fill="currentColor"/>
<path data-menu-dot="" d="M6.97724 46.0465C10.8712 46.0465 13.954 49.1872 13.954 52.9876C13.954 56.7879 10.8712 60 6.97724 60C3.08329 60 0.000499637 56.8567 0.000499637 52.9876C0.000499637 49.1185 3.15854 46.0465 6.97724 46.0465Z" fill="currentColor"/>
<path data-menu-dot="" d="M6.97706 0C10.871 0 13.9538 3.14071 13.9538 6.94107C13.9538 10.7414 10.871 13.9535 6.97706 13.9535C3.08311 13.9535 0.000317951 10.8102 0.000317951 6.94107C0.000317951 3.07196 3.15836 0 6.97706 0Z" fill="currentColor"/>
<path data-menu-dot="" d="M6.97724 23.7209C10.8712 23.7209 13.954 26.8616 13.954 30.662C13.954 34.4624 10.8712 37.6744 6.97724 37.6744C3.08329 37.6744 0.000499637 34.5311 0.000499637 30.662C0.000499637 26.7929 3.15854 23.7209 6.97724 23.7209Z" fill="currentColor"/>
</g>
</svg>
`,i.append(a);let o=[n,i],s=0;function c(){s=0;let e=o.map(e=>{let t=e.getBoundingClientRect(),n=document.elementsFromPoint(t.x+t.width/2,t.y+t.height/2).find(e=>!e.closest(`[data-component="site-header"]`));return n&&Number(getComputedStyle(n).getPropertyValue(`--header-light`))>=.5});o.forEach((t,n)=>{t.toggleAttribute(`data-header-ink`,!!e[n])})}function l(){s||=window.requestAnimationFrame(c)}return window.addEventListener(`scroll`,l,{passive:!0,signal:t}),window.addEventListener(`resize`,l,{passive:!0,signal:t}),r.addEventListener(`toggle`,l,{signal:t}),document.addEventListener(`click`,e=>{r.open&&e.target instanceof Element&&(!r.contains(e.target)||e.target.closest(`a[href]`))&&(r.open=!1)},{signal:t}),r.addEventListener(`keydown`,e=>{e.key===`Escape`&&r.open&&(e.preventDefault(),r.open=!1,i.focus({preventScroll:!0}))},{signal:t}),c(),()=>{window.cancelAnimationFrame(s),a.remove();for(let e of o)e.removeAttribute(`data-header-ink`)}}export{e as mount};