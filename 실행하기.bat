@echo off
chcp 65001
cls
echo [시스템] 포터블 서버를 시작합니다...
echo [시스템] 작업이 끝나면 이 창을 닫아주세요.

:: 1. 서버 실행 (8000번 포트로 실행, 현재 폴더를 루트로)
:: -l : 디렉토리 리스트 보여주기 옵션 (필요 없으면 빼도 됨)
:: -p : 포트 번호 설정
start server.exe -p 8000 -l

:: 2. 1초 대기 후 브라우저 열기 (서버 켜지는 시간 확보)
timeout /t 1 > nul
start http://localhost:8000/scanimage.html