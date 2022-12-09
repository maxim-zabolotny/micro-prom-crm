const nextButton = document.querySelector("#body > div > div > div.lego-reporting-view.activity-view.no-licensed.new-resizer > div.page > div > div.mainBlock > div > div.scaleSizeHolder > div > lego-report > lego-canvas-container > div > file-drop-zone > span > content-section > div:nth-child(3) > canvas-component > div > div > div.component > div > div > lego-table > div > div.pageControl > div.pageForward");

const getRows = () => {
    const rows = Array
        .from(document.querySelector("#body > div > div > div.lego-reporting-view.activity-view.no-licensed.new-resizer > div.page > div > div.mainBlock > div > div.scaleSizeHolder > div > lego-report > lego-canvas-container > div > file-drop-zone > span > content-section > div:nth-child(3) > canvas-component > div > div > div.component > div > div > lego-table > div > div.tableBody").children)
        .filter(row => row.classList.contains('row'))

    return rows
        .map(row => {
            const children = Array.from(row.children);
     
            return {
                'Категорія▲': children[0].innerText,
                'Ставка для режиму «Економ»': children[1].innerText,
                'Єдина ставка': children[2].innerText,
                'Ставка для «Більше продажів»': children[3].innerText,
            }    
        })     
}

const getState = () => {
    const stateRaw = document.querySelector("#body > div > div > div.lego-reporting-view.activity-view.no-licensed.new-resizer > div.page > div > div.mainBlock > div > div.scaleSizeHolder > div > lego-report > lego-canvas-container > div > file-drop-zone > span > content-section > div:nth-child(3) > canvas-component > div > div > div.component > div > div > lego-table > div > div.pageControl > div.pageLabel");
    const stateBetween = stateRaw.innerText.slice(0, stateRaw.innerText.indexOf('/'))

    return stateBetween
        .trim()
        .split('-')
        .map(el => Number(el))
}

const waitUntilNextState = async (prevState) => {
    let stateChanged = false;

    while(!stateChanged) {
        const [currentState] = getState()

        console.log('check next state:', { prevState, currentState })    
        if(prevState === currentState) {
            console.log('sleep 0.5s')
            await new Promise(r => setTimeout(r, 500));
            continue;
        }

        return currentState;
    }
} 

async function main() {
    const allRows = [];

    try {
        for(let i = 0; i <= 185; i++) {
            const [currentState, nextState] = getState();

            if(currentState === 4576) {
                console.log('get rows')
                const rows = getRows();
        
                allRows.push(...rows)

                console.log('end')
                break;
            }

            console.log('click')
            nextButton.click();
    
            console.log('wait next state')
            await waitUntilNextState(currentState);
    
            console.log('get rows')
            const rows = getRows();
    
            allRows.push(...rows)
        }
    } catch (err) {
        console.log('err => ', err)
    } finally {
        return JSON.stringify(allRows);
    }
}

main()
    .then(res => console.log(res))
    .catch(err => console.log('err => ', err))
