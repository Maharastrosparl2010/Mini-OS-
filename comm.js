import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// CONFIG
const appConfig = { apiKey: "AIzaSyCtjsy_NUH3vNHbiXlGP4nUmusefzIuJyI", authDomain: "all-in-one-community.firebaseapp.com", projectId: "all-in-one-community", storageBucket: "all-in-one-community.firebasestorage.app", messagingSenderId: "461209960805", appId: "1:461209960805:web:6f73660513cf6d3c40e18c" };
const db = getFirestore(initializeApp(appConfig));

// USERS & SUBJECTS
const USERS = ["Kartik","Rohan","Ranveer","Rishikesh","Malhar","Kunal","Raj","Saksham","Shravan","Soham Shivkar","Soham Ozkar","Soham Gade","Amrit","Atharva","Vedant","Mithilesh","Parth","Ansh","Guest"];
const SUBS = ["Hindi","Sanskrit","Marathi","English","Maths","Physics","Chemistry","Biology","History","Civics","Geography","Economics","IT"];

let state = { user:null, admin:false, attn:{}, chats:[], anns:[], events:[], banned:[], vips:[], teachers:[], news:[], resources:[], tt:{}, profiles:{}, file:null, selectedDate: new Date().toISOString().split('T')[0], replyingTo:null, selectedMsg:null, loginTime: Date.now() };

window.app = {
    // --- NOTIFICATIONS ---
    showToast: (msg, icon='fa-bell') => {
        const c = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = `<i class="fas ${icon} toast-icon"></i> <span>${msg}</span>`;
        c.appendChild(t);
        
        // System Notification
        if(Notification.permission === "granted" && document.hidden) {
            new Notification("New Notification", { body: msg, icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827301.png' });
        }

        setTimeout(() => t.remove(), 3000);
    },

    // --- CUSTOM POPUP SYSTEM ---
    popup: (msg, type='alert', cb=null) => {
        const p = document.getElementById('custom-popup');
        const acts = document.getElementById('popup-acts');
        document.getElementById('popup-msg').innerText = msg;
        acts.innerHTML = '';

        if(type === 'confirm') {
            const btnNo = document.createElement('button'); btnNo.className = 'popup-btn btn-cancel'; btnNo.innerText = 'No';
            btnNo.onclick = () => p.style.display = 'none';
            const btnYes = document.createElement('button'); btnYes.className = 'popup-btn btn-danger'; btnYes.innerText = 'Yes';
            btnYes.onclick = () => { p.style.display = 'none'; if(cb) cb(); };
            acts.appendChild(btnNo); acts.appendChild(btnYes);
        } else {
            const btnOk = document.createElement('button'); btnOk.className = 'popup-btn btn-confirm'; btnOk.innerText = 'OK';
            btnOk.onclick = () => p.style.display = 'none';
            acts.appendChild(btnOk);
        }
        p.style.display = 'flex';
    },

    // --- LOGIN ---
    login: async () => {
        const u = document.getElementById('u-in').value.trim();
        const p = document.getElementById('p-in').value.trim();
        const err = document.getElementById('err-msg');
        err.style.display = 'none';

        // Request Notification Permission
        if(Notification.permission !== "granted") Notification.requestPermission();

        if(u === 'admin' && p === 'admin@157390') { 
            app.finishLogin(u, true); return;
        }

        const found = USERS.find(name => name.toLowerCase() === u.toLowerCase());
        if (!found) { err.innerText = "User not found"; err.style.display = "block"; return; }

        const userRef = doc(db, "users", found);
        const userSnap = await getDoc(userRef);
        let valid = false;

        if (userSnap.exists()) {
            if (userSnap.data().password === p) valid = true;
        } else {
            if (p === "1234") { await setDoc(userRef, { password: "1234" }); valid = true; }
        }

        if(valid) app.finishLogin(found, false);
        else { err.innerText = "Wrong Password"; err.style.display = "block"; }
    },

    finishLogin: (user, is_admin) => {
        state.user = user;
        state.loginTime = Date.now();
        if(is_admin) state.admin = true;

        document.getElementById('loader-overlay').style.display='flex';
        setTimeout(() => {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            document.getElementById('loader-overlay').style.display='none';
            
            if(is_admin) {
                document.getElementById('admin-zone').style.display = 'block';
                document.getElementById('exam-del-btn').style.display = 'block';
            }

            document.getElementById('u-name').innerText = state.user;
            document.querySelector('#u-role').innerText = is_admin ? "Administrator" : "Student";
            document.getElementById('u-img').src = `https://ui-avatars.com/api/?name=${state.user}&background=random`;

            app.listen();
        }, 1000);
    },

    logout: () => { location.reload(); },

    listen: () => {
        onSnapshot(collection(db, "profiles"), (s) => {
            s.forEach(d => { state.profiles[d.id] = d.data().img; });
            if(state.profiles[state.user]) document.getElementById('u-img').src = state.profiles[state.user];
            document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
        });

        onSnapshot(doc(db, "settings", "banned"), (snap) => {
            if(snap.exists()){
                const d = snap.data();
                state.banned = d.list || [];
                state.vips = d.vips || [];
                if(state.banned.includes(state.user)) { app.popup("YOUR ACCOUNT IS BANNED"); location.reload(); }
            }
        });

        // Chat with Notifications
        onSnapshot(query(collection(db,"chats"), orderBy("time","asc")), (s)=>{
            state.chats = []; 
            s.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    if(msg.time > state.loginTime && msg.user !== state.user) {
                        app.showToast(`New msg from ${msg.user}`, 'fa-comments');
                    }
                }
            });
            s.forEach(d => {
                const msg = {id: d.id, ...d.data()};
                state.chats.push(msg);
                if(!msg.seenBy || !msg.seenBy.includes(state.user)) {
                    updateDoc(doc(db, "chats", msg.id), { seenBy: arrayUnion(state.user) });
                }
            });
            if(document.getElementById('chat-feed')) app.renderChat();
        });

        // Attendance
        onSnapshot(collection(db,"attendance_log"), (s)=>{
            s.forEach(d => { state.attn[d.id] = d.data(); });
            const today = new Date().toISOString().split('T')[0];
            if(state.attn[today] && state.attn[today][state.user]) {
                const s = state.attn[today][state.user];
                document.getElementById('my-att-status').innerHTML = `Status: <b style="color:${s==='P'?'#10b981':'#ef4444'}">${s}</b>`;
            }
            app.renderCal();
        });

        onSnapshot(doc(db, "settings", "exam"), (snap) => {
            if(snap.exists()) document.getElementById('next-exam-text').innerText = `${snap.data().name} (${snap.data().date})`;
            else document.getElementById('next-exam-text').innerText = "No Exam Scheduled";
        });

        onSnapshot(doc(db,"settings","timetable"), (s)=>{
            state.tt = s.exists() ? s.data() : { rows:["08:00", "09:00"], data:{} };
            if(document.getElementById('tt-grid')) app.renderTimeTable();
        });

        onSnapshot(collection(db,"events"), (s)=>{ state.events=[]; s.forEach(d=>state.events.push({id:d.id,...d.data()})); app.renderCal(); });
        
        // Announce Notification
        onSnapshot(collection(db,"announcements"), (s)=>{ 
            s.docChanges().forEach(c => {
                if(c.type==='added' && c.doc.data().time > state.loginTime) app.showToast("New Announcement!", "fa-bullhorn");
            });
            state.anns=[]; s.forEach(d=>state.anns.push({id:d.id,...d.data()})); 
            if(document.getElementById('ann-feed')) app.renderAnn(); 
        });
        
        onSnapshot(collection(db,"teachers"), (s)=>{ state.teachers=[]; s.forEach(d=>state.teachers.push({id:d.id,...d.data()})); if(document.getElementById('teach-list')) app.renderTeachers(); });
        onSnapshot(query(collection(db,"news"), orderBy("time","desc")), (s)=>{ state.news=[]; s.forEach(d=>state.news.push({id:d.id,...d.data()})); if(document.getElementById('news-list')) app.renderNews(); });
        onSnapshot(collection(db,"resources"), (s)=>{ state.resources=[]; s.forEach(d=>state.resources.push({id:d.id,...d.data()})); });
    },

    uploadAvatar: () => document.getElementById('avatar-input').click(),

    renderCal: () => {
        const d = new Date();
        document.getElementById('cal-month').innerText = d.toLocaleString('default',{month:'long'});
        const g = document.getElementById('cal-grid'); g.innerHTML='';
        const year = d.getFullYear(), month = d.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const start = new Date(year, month, 1).getDay();
        const nextEv = state.events.find(e => new Date(e.date) >= new Date());
        document.getElementById('next-ev').innerText = nextEv ? `${nextEv.title} (${new Date(nextEv.date).getDate()})` : "None";

        for(let i=0; i<start; i++) g.innerHTML += `<div></div>`;
        for(let i=1; i<=days; i++){
            const k = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            let dots = '';
            const log = state.attn[k];
            if(log && log[state.user]){
                const s = log[state.user];
                if(s==='P') dots+=`<div class="dot dot-p"></div>`; else if(s==='A') dots+=`<div class="dot dot-a"></div>`; else if(s==='HD') dots+=`<div class="dot dot-hd"></div>`;
            }
            if(state.events.find(e=>e.date===k)) dots+=`<div class="dot dot-e"></div>`;
            const isToday = i === d.getDate() ? 'today' : '';
            g.innerHTML += `<div class="day ${isToday}">${i}<div class="dots-row">${dots}</div></div>`;
        }
    },

    // --- UI OPEN ---
    open: (t) => {
        const m = document.getElementById('feature-modal'); m.style.display='flex';
        document.getElementById('f-title').innerText = t.toUpperCase();
        const b = document.getElementById('f-body'); b.innerHTML = '';
        
        if(t==='notes' || t==='syllabus' || t==='papers'){
            if(state.admin) b.innerHTML = `<button class="btn" style="width:100%;margin-bottom:15px;background:var(--success);color:black" onclick="app.modal('Add Link',[{id:'t',label:'Title'},{id:'l',label:'Link (URL)'}],v=>app.addRes('${t}',v))">Add Link</button>`;
            
            const list = state.resources.filter(r => r.type === t);
            if(list.length === 0) b.innerHTML += `<p style="text-align:center;color:#666;margin-top:20px">No content yet.</p>`;
            list.forEach(r => {
                b.innerHTML += `<div class="list-card" onclick="window.open('${r.link}','_blank')"><b>${r.title}</b><i class="fas fa-external-link-alt" style="color:var(--accent)"></i>${state.admin?`<i class="fas fa-trash del-icon" style="margin-left:10px" onclick="event.stopPropagation();app.delItem('resources','${r.id}')"></i>`:''}</div>`;
            });
        } 
        else if(t==='chat'){
            b.innerHTML = `<div class="chat-wrap"><div id="chat-feed" class="chat-feed"></div>
            <div id="reply-bar" class="reply-preview" style="display:none"><span>Replying...</span><i class="fas fa-times" onclick="app.cancelReply()"></i></div>
            <div class="chat-bar"><label><i class="fas fa-paperclip" style="color:#aaa;margin-right:10px;font-size:1.2rem"></i><input type="file" id="chat-input" hidden onchange="app.sendFile(event)"></label><input id="c-in" class="chat-in" placeholder="Message..."><i class="fas fa-paper-plane" style="color:var(--accent)" onclick="app.send()"></i></div></div>`;
            app.renderChat();
        } 
        else if(t==='timetable'){
            b.innerHTML = `<div class="tt-wrapper"><div class="tt-grid" id="tt-grid"></div></div>`;
            if(state.admin) b.innerHTML += `<div style="display:flex;gap:10px;margin-top:10px"><button class="btn" style="flex:1;background:#333;color:white" onclick="app.modal('Add Row',[{id:'t',label:'Time'}],v=>app.addTTRow(v[0]))">+ Row</button><button class="btn" style="flex:2;background:var(--primary);color:white" onclick="app.saveTT()">Save Changes</button></div>`;
            app.renderTimeTable();
        } 
        else if(t==='ann'){
            if(state.admin) b.innerHTML=`<div style="background:#222;padding:15px;border-radius:12px;margin-bottom:15px"><textarea id="a-in" style="width:100%;background:transparent;border:none;color:white;outline:none;min-height:60px" placeholder="Write..."></textarea><div style="display:flex;justify-content:space-between;margin-top:10px"><label style="color:var(--accent)"><i class="fas fa-image"></i><input type="file" hidden onchange="app.handleFile(event)"></label><button class="btn" style="background:var(--primary);padding:5px 15px;color:white" onclick="app.postAnn()">Post</button></div></div>`;
            b.innerHTML+=`<div id="ann-feed"></div>`; app.renderAnn();
        } 
        else if(t==='teach'){
            if(state.admin) b.innerHTML=`<button class="btn" style="width:100%;background:var(--primary);color:white;padding:10px;margin-bottom:15px" onclick="app.modal('Add Teacher',[{id:'s',label:'Subject'},{id:'n',label:'Name'},{id:'p',label:'Phone'}],v=>app.addTeach(v))">Add Teacher</button>`;
            b.innerHTML+=`<div id="teach-list"></div>`; app.renderTeachers();
        } 
        else if(t==='news'){
            if(state.admin) b.innerHTML=`<button class="btn" style="width:100%;background:var(--primary);color:white;padding:10px;margin-bottom:15px" onclick="app.modal('Post News',[{id:'t',label:'Title'},{id:'b',label:'Details'}],v=>app.postNews(v))">Post News</button>`;
            b.innerHTML+=`<div id="news-list"></div>`; app.renderNews();
        }
    },

    // --- CHAT SYSTEM (REPLY & SEEN BY) ---
    renderChat: () => {
        const c = document.getElementById('chat-feed'); if(!c) return;
        c.innerHTML = '';
        state.chats.forEach(m => {
            const mine = m.user === state.user;
            const isVip = state.vips.includes(m.user);
            const pic = state.profiles[m.user] || `https://ui-avatars.com/api/?name=${m.user}&background=random`;
            
            c.innerHTML += `
            <div class="msg-row ${mine?'mine':''}">
                ${!mine ? `<img src="${pic}" class="chat-pfp">` : ''}
                <div class="msg ${mine?'mine':'theirs'}" onclick="app.msgOpt('${m.id}', '${m.user}', '${m.text}')">
                    <b>${m.user}</b> ${isVip?'<span class="vip-tag">VIP</span>':''}<br>
                    ${m.replyTo ? `<div class="quoted-msg"><b>Replying to:</b><br>${m.replyTo}</div>` : ''}
                    ${m.img?`<img src="${m.img}" class="msg-img" onclick="event.stopPropagation();app.viewMedia(this.src)">`:''}
                    ${m.text}
                    <div style="text-align:right;font-size:0.6rem;opacity:0.7;margin-top:5px">
                        ${new Date(m.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} 
                    </div>
                </div>
                ${mine ? `<img src="${pic}" class="chat-pfp">` : ''}
            </div>`;
        });
        c.scrollTop = c.scrollHeight;
    },

    // OPEN MESSAGE OPTIONS
    msgOpt: (id, user, text) => {
        state.selectedMsg = {id, user, text};
        const canDel = (user === state.user) || state.admin || state.vips.includes(state.user);
        document.getElementById('btn-msg-del').style.display = canDel ? 'block' : 'none';
        document.getElementById('msg-options').style.display = 'flex';
    },

    // REPLY
    doReply: () => {
        state.replyingTo = state.selectedMsg;
        document.getElementById('msg-options').style.display = 'none';
        const bar = document.getElementById('reply-bar');
        if(bar) {
            bar.style.display = 'flex';
            bar.querySelector('span').innerText = `Replying to ${state.replyingTo.user}: ${state.replyingTo.text.substring(0,20)}...`;
        }
    },
    cancelReply: () => { state.replyingTo = null; document.getElementById('reply-bar').style.display = 'none'; },

    // INFO (SEEN BY)
    showInfo: async () => {
        document.getElementById('msg-options').style.display = 'none';
        const msgDoc = await getDoc(doc(db, "chats", state.selectedMsg.id));
        const seen = msgDoc.exists() ? (msgDoc.data().seenBy || []) : [];
        app.popup(`Seen by:\n${seen.join('\n') || "Just now"}`);
    },

    // DELETE MSG
    doDelMsg: () => {
        document.getElementById('msg-options').style.display = 'none';
        app.popup("Delete this message?", 'confirm', async () => {
            await deleteDoc(doc(db,"chats", state.selectedMsg.id));
        });
    },

    send: async () => {
        const v = document.getElementById('c-in').value;
        if(v || state.file){
            await addDoc(collection(db,"chats"), {
                user:state.user, text:v, img:state.file, time:Date.now(),
                replyTo: state.replyingTo ? `${state.replyingTo.user}: ${state.replyingTo.text}` : null
            });
            document.getElementById('c-in').value = ''; state.file = null; app.cancelReply();
        }
    },

    compressImage: (file, callback) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                callback(canvas.toDataURL('image/jpeg', 0.7)); 
            }
        }
    },

    sendFile: (e) => {
        const f = e.target.files[0];
        if(f) {
            app.popup("Compressing & Sending...");
            app.compressImage(f, (base64) => { state.file = base64; app.send(); });
        }
    },
    handleFile: (e) => { 
        const f = e.target.files[0]; 
        if(f) {
            app.compressImage(f, (base64) => { state.file = base64; app.popup("Image Attached"); });
        }
    },

    renderAnn: () => {
        const c=document.getElementById('ann-feed'); if(!c) return; c.innerHTML='';
        state.anns.forEach(a=>{
            c.innerHTML+=`<div class="list-card" style="display:block"><div><span style="color:var(--accent)">ANNOUNCEMENT</span> <small style="float:right;color:#666">${new Date(a.time).toLocaleDateString()}</small></div><p style="margin-top:10px">${a.text}</p>${a.img?`<img src="${a.img}" style="width:100%;border-radius:10px;margin-top:10px" onclick="app.viewMedia(this.src)">`:''}${state.admin?`<div style="margin-top:10px;text-align:right"><i class="fas fa-trash del-icon" onclick="app.delItem('announcements','${a.id}')"></i></div>`:''}</div>`;
        });
    },
    postAnn: async () => { const v=document.getElementById('a-in').value; if(v||state.file){ await addDoc(collection(db,"announcements"),{text:v,img:state.file,time:Date.now()}); state.file=null; app.open('ann'); } },

    viewMedia: (s) => { document.getElementById('media-viewer').style.display='flex'; document.getElementById('media-img').src=s; },
    
    delItem: (col,id) => app.popup("Delete Item?", 'confirm', async () => await deleteDoc(doc(db,col,id))),
    delExam: () => app.popup("Remove Exam?", 'confirm', async () => await deleteDoc(doc(db,"settings","exam"))),

    addTeach: async (v) => { await addDoc(collection(db,"teachers"),{sub:v[0],name:v[1],phone:v[2]}); app.popup("Teacher Added"); app.open('teach'); },
    renderTeachers: () => {
        const c=document.getElementById('teach-list'); if(!c) return; c.innerHTML='';
        state.teachers.forEach(t=>{ c.innerHTML+=`<div class="list-card"><div><b>${t.sub}</b><br>${t.name}<br><small>${t.phone}</small></div>${state.admin?`<i class="fas fa-trash del-icon" onclick="app.delItem('teachers','${t.id}')"></i>`:`<a href="tel:${t.phone}" style="color:var(--success)"><i class="fas fa-phone"></i></a>`}</div>`; });
    },
    
    postNews: async (v) => { await addDoc(collection(db,"news"),{title:v[0],body:v[1],time:Date.now()}); app.popup("News Posted"); app.open('news'); },
    renderNews: () => {
        const c=document.getElementById('news-list'); if(!c) return; c.innerHTML='';
        state.news.forEach(n=>{ c.innerHTML+=`<div class="list-card" style="display:block"><b style="color:var(--warning)">LIVE UPDATE</b><h4 style="margin:5px 0">${n.title}</h4><p style="font-size:0.9rem;color:#aaa">${n.body}</p>${state.admin?`<br><i class="fas fa-trash del-icon" onclick="app.delItem('news','${n.id}')"></i>`:''}</div>`; });
    },

    addRes: async (type, v) => { await addDoc(collection(db,"resources"),{type:type, title:v[0], link:v[1]}); app.popup("Link Added"); app.open(type); },

    renderTimeTable: () => {
        const g = document.getElementById('tt-grid'); if(!g) return;
        g.innerHTML = `<div class="tt-cell tt-head">Time</div>` + ["Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="tt-cell tt-head">${d}</div>`).join('');
        if(!state.tt.rows) state.tt.rows = ["08:00", "09:00", "10:00", "11:00", "12:00"];
        state.tt.rows.forEach((t, i) => {
            g.innerHTML += `<div class="tt-cell tt-time">${t} ${state.admin?`<i class="fas fa-trash tt-del-btn" onclick="app.delRow(${i})"></i>`:''}</div>`;
            for(let j=0; j<6; j++){
                const day = ["Mon","Tue","Wed","Thu","Fri","Sat"][j];
                const val = (state.tt.data[t] && state.tt.data[t][day]) || "";
                g.innerHTML += `<div class="tt-cell">${state.admin?`<input class="tt-input" onchange="app.upTT('${t}','${day}',this.value)" value="${val}">`:val}</div>`;
            }
        });
    },
    upTT: (t,d,v) => { if(!state.tt.data[t]) state.tt.data[t]={}; state.tt.data[t][d]=v; },
    addTTRow: (t) => { if(t){ state.tt.rows.push(t); app.renderTimeTable(); } },
    delRow: (i) => app.popup("Remove Row?", 'confirm', () => { state.tt.rows.splice(i,1); app.renderTimeTable(); }),
    saveTT: async () => { await setDoc(doc(db,"settings","timetable"), state.tt); app.popup("Saved!"); },

    openAttn: () => {
        const m=document.getElementById('feature-modal'); m.style.display='flex';
        document.getElementById('f-title').innerText="ATTENDANCE";
        document.getElementById('f-body').innerHTML=`<div class="attn-date-bar"><span>Date:</span><input type="date" id="attn-date" onchange="app.changeDate(this.value)" style="background:none;border:none;color:white;font-family:inherit"></div><div id="attn-list"></div>`;
        document.getElementById('attn-date').value = state.selectedDate;
        app.renderAdminAttn();
    },
    changeDate: (v) => { state.selectedDate = v; app.renderAdminAttn(); },
    renderAdminAttn: () => {
        const c=document.getElementById('attn-list'); if(!c) return; c.innerHTML='';
        const d = state.selectedDate;
        const data = state.attn[d] || {};
        USERS.forEach(u=>{
            const s=data[u];
            const pic = state.profiles[u] || `https://ui-avatars.com/api/?name=${u}&background=random`;
            c.innerHTML+=`<div class="st-card"><div class="st-head"><img src="${pic}" class="st-face"> <span>${u}</span></div><div class="st-acts"><div class="act-btn ${s==='P'?'active-P':''}" onclick="app.mark('${d}','${u}','P')">P</div><div class="act-btn ${s==='A'?'active-A':''}" onclick="app.mark('${d}','${u}','A')">A</div><div class="act-btn ${s==='HD'?'active-HD':''}" onclick="app.mark('${d}','${u}','HD')">HD</div><div class="act-btn ${s==='H'?'active-H':''}" onclick="app.mark('${d}','${u}','H')">H</div></div></div>`;
        });
    },
    mark: async (d,u,s) => { 
        const n = state.attn[d] || {}; n[u]=s; 
        state.attn[d] = n; app.renderAdminAttn();
        await setDoc(doc(db,"attendance_log",d),n); 
    },

    openBan: () => {
        const m=document.getElementById('feature-modal'); m.style.display='flex';
        document.getElementById('f-title').innerText="USERS & VIP";
        const c=document.getElementById('f-body'); c.innerHTML='';
        USERS.forEach(u=>{
            const b=state.banned.includes(u);
            const v=state.vips.includes(u);
            c.innerHTML+=`
            <div class="list-card">
                <b>${u} ${v?'<span class="vip-tag">VIP</span>':''}</b>
                <div style="display:flex;gap:5px">
                    <button style="padding:5px 8px;background:var(--accent);color:black;border:none;border-radius:5px" onclick="app.modal('Change Password',[{id:'p',label:'New Password'}], v=>app.resetPass('${u}',v[0]))"><i class="fas fa-key"></i></button>
                    <button style="padding:5px 8px;background:${v?'#ffd700':'#333'};color:${v?'#000':'#fff'};border:none;border-radius:5px" onclick="app.toggleVIP('${u}')">VIP</button>
                    <button style="padding:5px 8px;background:${b?'var(--success)':'var(--danger)'};color:white;border:none;border-radius:5px" onclick="app.toggleBan('${u}')">${b?'Unban':'Ban'}</button>
                </div>
            </div>`;
        });
    },
    resetPass: async (u, p) => { await setDoc(doc(db,"users",u),{password:p}); app.popup(`Password for ${u} changed!`); },
    toggleBan: async (u) => { let l=[...state.banned]; if(l.includes(u))l=l.filter(x=>x!==u); else l.push(u); await setDoc(doc(db,"settings","banned"),{list:l, vips:state.vips}); app.openBan(); },
    toggleVIP: async (u) => { let l=[...state.vips]; if(l.includes(u))l=l.filter(x=>x!==u); else l.push(u); await setDoc(doc(db,"settings","banned"),{list:state.banned, vips:l}); app.openBan(); },

    addEvent: async (t,d) => { if(t&&d) await addDoc(collection(db,"events"),{title:t,date:d}); },
    updateExam: async (n,d) => { if(n&&d) await setDoc(doc(db,"settings","exam"),{name:n,date:d}); },

    modal: (t,i,cb) => {
        document.getElementById('im-title').innerText=t; const c=document.getElementById('im-fields'); c.innerHTML='';
        i.forEach(x=>{c.innerHTML+=`<input id="mi-${x.id}" class="login-input" placeholder="${x.label}">`});
        document.getElementById('input-modal').style.display='flex';
        document.getElementById('im-save').onclick=()=>{ const v=i.map(x=>document.getElementById(`mi-${x.id}`).value); if(v.every(z=>z)){cb(v);document.getElementById('input-modal').style.display='none'} };
    }
};

document.getElementById('avatar-input').addEventListener('change', e => {
    const f = e.target.files[0];
    if(f) {
        app.compressImage(f, async (base64) => {
            await setDoc(doc(db, "profiles", state.user), { img: base64 });
            app.popup("Avatar Updated!");
        });
    }
});

setInterval(()=>{
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
},1000);