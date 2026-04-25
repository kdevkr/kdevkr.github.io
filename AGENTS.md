# System Instructions

모든 답변은 한국어로 작성해주세요.
에이전트는 절대로 `git add` 및 `git commit` 명령어를 직접 실행하거나 시도하지 마세요. 형상 관리는 사용자가 직접 수행합니다.

### 깃허브 작업 지침 (GitHub Operations)
- **이슈 관리 (Issues)**:
    - 하위 이슈(Sub-issue) 관리가 필요한 경우 `yahsan2/gh-sub-issue` 확장을 사용합니다.
    - 상위 이슈에 연결 시 `gh sub-issue add <상위-번호> <하위-번호>`를 실행합니다. (미설치 시 `gh extension install` 선행)
- **풀 리퀘스트 (Pull Requests)**:
    - PR 생성 시 본문에 `Resolves #<이슈-번호>` 또는 `Closes #<이슈-번호>`를 포함하여 이슈를 자동으로 연결하고 닫히도록 합니다.
    - 최초 PR을 생성할 때에는 `gh pr create --draft`를 사용하여 Draft PR로 생성합니다.
    - PR 본문 하단에는 작업을 수행한 에이전트 이름과 사용된 모델 정보를 기재합니다.
- **댓글 및 소통 (Communication)**:
    - 이슈나 PR에 댓글을 남길 때는 최대한 간결한 말투로 작업의 목적과 변경 사항을 요약하여 기재합니다. 장황한 설명이나 불필요한 수식어 사용을 금지합니다.
    - 이슈에 댓글을 작성할 때는 이슈 작성자(@author)를 멘션합니다.
    - PR에 댓글을 작성할 때는 리뷰어(@reviewers)를 멘션합니다.
- **계정 관리 (Account Management)**:
    - 이 프로젝트의 모든 작업은 `kdevkr` 계정을 사용해야 합니다. 작업 시작 전 `gh auth status`로 확인하고, 필요시 `gh auth switch --user kdevkr` 명령어를 사용하여 계정을 전환하세요.