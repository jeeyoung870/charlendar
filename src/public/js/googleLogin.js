const loginUserInfo = document.getElementById("loginUserInfo");
const authConfigOptions = {
    method: 'POST',
    url: "/gLogin_auth_config",
    withCredentials: true
};
const ACCESS_TOKEN_KEY = 'nigolRadnelrahc';
const AUTHORIZE_URI = "https://accounts.google.com/o/oauth2/v2/auth";
const PEOPLE_API = "https://people.googleapis.com/v1/people/me?";
// 조회할 사용자 정보 종류 설정
const PERSON_FIELDS = "personFields="+"emailAddresses%2C"+"names%2C"+"ageRanges%2C"+"genders%2C"+"photos&";
// scope uri
// const BIRTHDAY = "https://www.googleapis.com/auth/user.birthday.read";
const USERINFOEMAIL = "https://www.googleapis.com/auth/userinfo.email";
const PROFILE = "https://www.googleapis.com/auth/userinfo.profile";
const AGERANGE = "https://www.googleapis.com/auth/profile.agerange.read";
const GENDER = "https://www.googleapis.com/auth/user.gender.read";

function loginCheck() {
    return new Promise((resolve,reject) => {
        // alert('loginCheck');
        const access_token  = localStorage.getItem(ACCESS_TOKEN_KEY);
        // alert(access_token);
        if(!access_token){
            // alert('토큰없음');
            const { access_token } = Qs.parse(window.location.hash.substr(1));
            // alert(access_token);
            if(!access_token) {
                // alert('구글 미로그인 상태');
                const win = window.location;
                win.assign(`${win.origin}/welcome?path=${win.pathname}`);
            } else {
                localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
                loginCheck().then(userInfo => {resolve(userInfo);});    // ??이게맞나
            }
        } else {
            // alert('토큰있음! 챌린더로그인');
            doCharlendarLogin(access_token).then( user => {
                // alert(`doCharlendarLogin성공: ${user.userId}`);
                resolve( {userId: user.userId, userNm: user.userNm} );
                // ReactDOM.render(<LoginUser userId={user.userId} userNm={user.userNm} />, loginUserInfo); 
            });
        }
    });
    
}


function doCharlendarLogin(access_token) {
    return new Promise((resolve,reject) => {
        axios.request(authConfigOptions).then(res => {
            const API_KEY = "key=" + res.data.API_KEY;
            const PEOPLE_URI = `${PEOPLE_API}${PERSON_FIELDS}${API_KEY}`;
            fetch(PEOPLE_URI, {
                headers: { Authorization: "Bearer " + access_token }
            })
            .then(response => response.json())
            .then(uInfo => {
                const userInfo = {
                    userId: uInfo.emailAddresses[0].value,
                    userNm: uInfo.names[0].givenName,
                    photoUrl: uInfo.photos[0].url,
                    ageRange: uInfo.ageRanges[0].ageRange,
                    gender: uInfo.genders[0].value
                };
                userSignIn(userInfo);
                console.log(userInfo);
                resolve(userInfo);
            })
            .catch(err => {  //토큰만료 or 요청에러
                localStorage.removeItem(ACCESS_TOKEN_KEY);
                alert('Log-in information expired. Move to Landing page.');
                const win = window.location;
                win.assign(`${win.origin}/welcome?path=${win.pathname}`);
            });
        }).catch(function (error) {
            console.error(error);
        });
    });
}
function userSignIn(userInfo) {
    const signInOptions = {
        method: 'POST',
        url: "/user_signIn",
        data: userInfo,
        withCredentials: true
    };
    axios.request(signInOptions).then(res => {
        // alert(`id = ${res.data[0].userid} | ${res.data[0].usernm} 님 회원등록 성공!`);
    }).catch(function (error) {
    console.error(error);
    });
}
function doGoogleLogin(redirectPath) {
    axios.request(authConfigOptions).then(res => {
        const googleLoginOptions = {
            client_id: res.data.CLIENT_ID,
            redirect_uri: window.location.origin + redirectPath,
            response_type: "token",
            scope: `${USERINFOEMAIL} ${AGERANGE} ${GENDER} ${PROFILE}`
        };
        const queryStr = Qs.stringify(googleLoginOptions);
        const loginUrl = AUTHORIZE_URI + "?" + queryStr;
        // alert('현재 : '+window.location.origin + window.location.pathname);
        window.location.assign(loginUrl);
    });
}
function logout(){
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    alert('Log-out Succeed.');
    const win = window.location;
    win.assign(`${win.origin}/welcome`);
}