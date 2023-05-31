# charlendar

charlendar Project using Nodejs, Reactjs, axios, git-crypt and PostgreSQL.
Cloud deploy with fly.io.
When running on localhost, this app cannot externally connect to fly.io postgre DB.(use local DB)

-
-

#00 CHECK BEFORE DEPLOY

1. 'server.js' file > listening port
2. 'postgreDB.js' file > DB client (fly internal or local)
3. 'config.js' file > ensure to be decrypted. (refer 'howTo_git-crypt.txt')
4. html files except welcome page > script link 'devtools-detector.js'

#01 LOCAL INSTALL AND SETTING

[ setting before develop(NodeJS Server Setup) ]

1.  Charlendar > npm init -y
    Charlendar > git init
    Charlendar > npm i nodemon -D
    Charlendar > npm i @babel/core @babel/cli @babel/node -D
    Charlendar > touch .gitignore
2.  create and write 'nodemon.json', 'babel.config.json' file
    create folder 'src' and file 'server.js'(backend js file)
3.  Charlendar > npm i @babel/preset-env -D
4.  Charlendar > npm i express
    (Charlendar > npm i pug)
    Charlendar > npm i ejs
    Charlendar > npm i axios
    Charlendar > npm i cheerio
    Charlendar > npm install node-schedule
    (Charlendar> npm install -g pm2)
    (Charlendar > npm i @fullcalendar/react @fullcalendar/daygrid)
5.  change 'package.json' > "scripts":{"dev": "nodemon"}
6.  Charlendar > npm run dev

[ PostgreSql(internal) setting ]
Before this, you should install postgres locally, and check db name.

1. config.js :
   edit postgre:{} property (connection info)
2. postgreDB.js :
   check whether it's using // local postgre connection's client
3. Charlendar > npm install pg
4. import to server.js :
   import { Client } from "pg";
   import { Query } from 'pg';

[ front setting(Express) ]

1.  create directory: src>public>js>app.js (frontend js file)
2.  set 'server.js' :
    app.set("views", \_\_dirname + "/public/views");
    app.use("/public", express.static(\_\_dirname + "/public"));
3.  'server.js' > make router :
    app.get("/", (req, res) => {res.render("home");});
4.  'nodemon.json' > add "ignore" to not restart server at changing front codes :
    "ignore" : ["src/public/*"]
5.  html file > add mvp.css link to auto-decorate html

[ Order of file config ]
nodemon.json -> src/server.js -> views/home.pug -> js/app.js

-
-

#02 APPLIED API

[ axios + cheerio ]
https://velog.io/@_nine/Node.js-Crawling-feat.-Cheerio

[ Google login ]
https://www.daleseo.com/google-oauth/
https://developers.google.com/people/api/rest/v1/people/get

[ rapidapi(chartdata) ]
https://rapidapi.com/apidojo/api/yh-finance/

[ devtools-detector.js ]
https://domdom.tistory.com/359

[ apexchart ]
https://apexcharts.com/docs/options/annotations/

[ node-schedule ]
https://github.com/node-schedule/node-schedule
https://undefinedp.github.io/Node/node_schedule/
https://choonse.com/2021/12/22/492/

[ pm2 ]
https://engineering.linecorp.com/ko/blog/pm2-nodejs/
https://velog.io/@broccoliindb/Heroku
https://inpa.tistory.com/entry/node-%F0%9F%93%9A-PM2-%EB%AA%A8%EB%93%88-%EC%82%AC%EC%9A%A9%EB%B2%95-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EB%AC%B4%EC%A4%91%EB%8B%A8-%EC%84%9C%EB%B9%84%EC%8A%A4#pm2_%EC%84%A4%EC%A0%95_%ED%8C%8C%EC%9D%BC_%EB%A7%8C%EB%93%A4%EA%B8%B0_ecosystem.config.js

-
-

#03 DEPLOY WITH FLY.IO(CLOUD SERVER)

[ install fly.io ]
https://fly.io/docs/languages-and-frameworks/node/

1. powershell > iwr https://fly.io/install.ps1 -useb | iex
2. powershell > flyctl auth login

[ create app(charlendar) ]

1. powershell > flyctl launch
   set app name and region.
   !! don't make DB, and quit before deploy.
   This will generate 'fly.toml' file.

[ set to deploy ]

1. fly.toml > add property to [experimental]
   cmd = "npm run dev"
2. powershell > flyctl deploy --app [app_name]

\*\* If there is an error while deploying, run 'fly doctor' to check deploy status.

[ set to auto restart ]

- When app crashes, this config will restart app automatically.
  https://community.fly.io/t/instance-or-service-not-restarted-when-i-expected-it-to/6155

1. fly.toml > edit [[services.tcp_checks]] > restart_limit
   [[services.tcp_checks]]
   grace_period = "1s"
   interval = "15s"
   restart_limit = 3
   timeout = "2s"

\* default (restart_limit = 0) means do not restart.

[ create fly DB(charlendar-db) app ]
! you should do this at diffrrent directory.

1.  charlendar-db/powershell > fly postgres create
    !choose 1GB volume.
    !save DB info created while postgres creation.

[ attach charlendar-db on charlendar app ]

1.  return to charlendar powershell > flyctl postgres attach --app charlendar charlendar-db
    after running 'fly pg attach charlendar-db':
    => new DATABASE_URL secret will added to charlendar app.(!! save the URL)
    => new database(name=charlendar) will be created in charlendar-db
    charlendar-db/powershell > flyctl postgres users list charlendar-db
2.  charlendar > 'config.js' file:
    check 'db_info.txt' file, and change DATABASE_URL with new added Connection string :
    DATABASE_URL="postgres://charlendar:fzw5iptoNUjVS36@top2.nearest.of.charlendar-db.internal:5432/charlendar?sslmode=disable"
3.  charlendar > 'postgreDB.js' :
    check whether it's using // fly.io internal connection's client
4.  charlendar-db/powershell > fly ips allocate-v6 --app charlendar-db
5.  charlendar-db/powershell > flyctl config save -a charlendar-db
    this will make 'fly.toml' file.(without this file, you can't deploy or restart app.)
6.  change DB 'fly.toml' file(add or edit section) :
    [build]
    builder = "heroku/buildpacks:20"
    [mounts]
    source = "pg_data"
    destination = "/data"

\* "pg_data" is => fly.io web Dashboard > charlendar-db > Volumes > the name of volume.

7. restart charlendar-db, and re-deploy charlendar.

\*\* to re-deploy, run below.

1. charlendar/powershell > flyctl deploy --app charlendar
2. charlendar-db/powershell > flyctl deploy --app charlendar-db

\*\* to restart, run below.

1. charlendar/powershell > flyctl apps restart charlendar
2. charlendar-db/powershell > fly pg restart charlendar-db

[ fly postgres DB connection & schema setting ]

1. charlendar-db/powershell > fly postgres connect -a charlendar-db
2. postgres=# \l --> view db list
3. postgres=# \c charlendar
   =>enter charlendar database
4. charlendar=# create schema cld authorization postgres;
5. grant auth to schema :
   charlendar=# grant all on schema cld to postgres;
   charlendar=# grant usage, select on all sequences in schema cld to postgres;
   charlendar=# ALTER DEFAULT PRIVILEGES IN SCHEMA cld GRANT USAGE, SELECT ON SEQUENCES TO postgres;
   charlendar-# \dn+ -->view schema list and check 'cld'
   List of schemas
   Name | Owner | Access privileges | Description
   --------+------------+--------------------------+------------------------
   cld | postgres | postgres=UC/postgres |
6. see 'db_CLD_DDL.txt' file, and query to create tables

-

-
-
-
-
-
-

#04 USE pm2 TO SERVICE NON-STOP SERVER APPLICATION --------> not used

- When app crashes, pm2 manages project to restart automatically

[ setting for pm2 ]

1. 'package.json' > add "preinstall","start" to "scripts"
   "scripts": {
   "dev": "nodemon",
   "preinstall": "npm install pm2 -g"
   },
2. Create 'pm2.config.js' file and write.
3. 'fly.toml' > change [experimental]>cmd script.
   [experimental]
   auto_rollback = true
   cmd = "pm2 start pm2.config.js"

[ externalize fly.io db ] --------> not used

1.  powershell > flyctl ips list --app charlendar-db
    ('charlendar-db' is fly.io postgreSQL app name. Check allocated ip.
    if there is no ip for the app, run code below)
    powershell > flyctl ips allocate-v4 --app charlendar-db
2.  modify fly.toml (8080 -> 5432) :
    [[services]]
    internal_port = 5432 # Postgres instance

        [[services.ports]]
            port = 5432 # Postgres instance
