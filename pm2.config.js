// pm2 (무중단 서비스 실행용 프로젝트 매니저) 설정파일.
// 리눅스 기반에서는 실행가능한데, 윈도우 기반인 경우 다른 방법을 사용해야 한다.
// ㄴ https://ordinary-code.tistory.com/67
module.exports = {
    apps: [{
        name: 'charlendar',
        script: 'npm',
        args: 'run dev',
        // instances: 0,
        // exec_mode: 'cluster',
        // env: { // 개발 환경변수 지정
        //     Server_PORT: 8080,
        //     NODE_ENV: 'development'
        //  },
        env_production: {
            Server_PORT: 8080,
            NODE_ENV : "production" // 배포환경시 적용될 설정 지정
        }
    }]
}