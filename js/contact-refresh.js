(()=>{
 const form=document.getElementById('inquiry-form');if(!form)return;
 const button=document.getElementById('inquiry-submit'),status=document.getElementById('form-status');
 let busy=false,sent=false;
 const email=form.elements.email,emailError=document.getElementById('email-error');
 function validateEmail(){
  email.value=email.value.trim();email.setCustomValidity('');
  const missing=!email.value;
  const invalid=missing||email.validity.typeMismatch||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
  const ja=missing?'メールアドレスを入力してください。':'メールアドレスの形式をご確認ください（例：name@example.com）。';
  const en=missing?'Please enter your email address.':'Please enter a valid email address (for example, name@example.com).';
  emailError.hidden=!invalid;email.setAttribute('aria-invalid',String(invalid));
  emailError.dataset.ja=ja;emailError.dataset.en=en;
  emailError.textContent=document.documentElement.lang==='en'?en:ja;
  email.setCustomValidity(invalid?emailError.textContent:'');return !invalid;
 }
 email.addEventListener('blur',validateEmail);
 email.addEventListener('invalid',validateEmail);
 email.addEventListener('input',()=>{email.setCustomValidity('');emailError.hidden=true;email.removeAttribute('aria-invalid');});

 const messages={sending:['送信しています…','Sending…'],success:['お問い合わせを受け付けました。ご返信までお待ちください。','Your inquiry has been received. We will be in touch.'],error:['送信を確認できませんでした。入力内容は保持されています。通信環境をご確認のうえ、少し時間をおいて再度お試しください。','We could not confirm submission. Your entries have been preserved. Please check your connection and try again shortly.']};
 function announce(state){const [ja,en]=messages[state];status.hidden=false;status.dataset.ja=ja;status.dataset.en=en;status.textContent=document.documentElement.lang==='en'?en:ja;status.className='form-status '+state;}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||sent)return;const emailValid=validateEmail();if(!form.reportValidity()||!emailValid)return;
  if(form.elements.botcheck.checked)return;
  const emptyField=['name','company','message'].map(key=>form.elements[key]).find(field=>!field.value.trim());
  if(emptyField){emptyField.setCustomValidity(document.documentElement.lang==='en'?'Please enter a value.':'内容を入力してください。');emptyField.reportValidity();emptyField.addEventListener('input',()=>emptyField.setCustomValidity(''),{once:true});return;}

  busy=true;button.disabled=true;form.setAttribute('aria-busy','true');announce('sending');
  document.getElementById('form-language').value=document.documentElement.lang;
  const data=Object.fromEntries(new FormData(form));delete data.redirect;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  try{
   const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data),signal:controller.signal});
   const result=await response.json();if(!response.ok||result.success!==true)throw new Error('Unconfirmed submission');
   sent=true;announce('success');form.reset();status.focus();
  }catch{announce('error');status.focus();}
  finally{clearTimeout(timer);busy=false;button.disabled=sent;form.removeAttribute('aria-busy');}
 });
})();
