import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import { Button, PageHeader, Tooltip, AutoComplete, Row, Col, Empty, Select, Collapse, Table, Radio } from 'antd';
import { LoadingOutlined, SearchOutlined, BorderlessTableOutlined, BookOutlined } from '@ant-design/icons'
import '@tensorflow/tfjs-backend-webgl';
import mondaySdk from "monday-sdk-js";
import Fuse from 'fuse.js'

const monday = mondaySdk();
const { Option } = Select;
const { Panel } = Collapse;

const qna = require("@tensorflow-models/qna")


const SearchView = (props) => {

    const [dataLoading, setDataLoading] = useState(false)
    const [resultsLoading, setResultsLoading] = useState(false)
    const [boardGroups, setBoardGroups] = useState([])
    const [boardColumns, setBoardColumns] = useState([])
    const [allData, setAllData] = useState({})
    const [allResults, setAllResults] = useState({})
    const [wiki, setWiki] = useState("")
    const [isMounted, setIsMounted] = useState(false)
    const [boardId, setBoardId] = useState("")
    const [model, setModel] = useState()
    const [question, setQuestion] = useState(props.location.state.question ? props.location.state.question : "")
    const [dataSource, setDataSource] = useState([])
    const [resultsColumns, setResultsColumns] = useState([])
    const [tableDataSource, setTableDataSource] = useState([])
    const [tableDataColumns, setTableDataColumns] = useState([])
    const [searchGroups, setSearchGroups] = useState(props.location.state.groups ? props.location.state.groups : ["All Groups"])
    const [searchColumns, setSearchColumns] = useState(props.location.state.columns ? props.location.state.columns : ["All Columns"])
    const [searchType, setSearchType] = useState(props.location.state.searchType ? props.location.state.searchType : "question")
    const [responseView, setResponseView] = useState(false)
    const [itemIdToCorpusIdx, setItemIdToCorpusIdx] = useState({})
    const [itemAllResults, setItemAllResults] = useState({})
    const [getQAutoComplete, setGetQAutoComplete] = useState([]);
    const [searchHistory, setSearchHistory] = useState([])

    const backButton = useHistory()

    const optionsWithDisabled = [
        { label: <BookOutlined />, value: false },
        { label: <BorderlessTableOutlined />, value: true },
    ];


  const handleSearch = (value) => {
    let res = searchHistory;

    if (!value) {
      res.slice(0, 5)
    } else {
        res = res.filter(str => str.match(value));
    }

    setGetQAutoComplete(res);
  };

    const groupMenu = (
        <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="select one country"
            defaultValue={searchGroups}
            onChange={getSearchGroups}
            optionLabelProp="label"
            value={searchGroups}
        >    
        {boardGroups.map(function (group, index){
            return (
                <Option value={group.id} label={group.title} key={index}>
                    <div className="demo-option-label-item">
                        {group.title}
                    </div>
                </Option>
            )
        })}
        </Select>
    );

    const fuseOptionsWithExact = {
        // isCaseSensitive: false,
        // includeScore: false,
        // shouldSort: true,
        includeMatches: true,
        // findAllMatches: false,
        // minMatchCharLength: 1,
        // location: 0,
        // threshold: 0.6,
        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        keys: [
          "name",
          "column_values.text"
        ]
      };

      const fuseOptionsWithFuzzy = {
        // isCaseSensitive: false,
        // includeScore: false,
        // shouldSort: true,
        includeMatches: true,
        // findAllMatches: false,
        // minMatchCharLength: 1,
        // location: 0,
        // threshold: 0.6,
        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        keys: [
          "name",
          "column_values.text"
        ]
      };
      

    const columnMenu = (
        <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="select one country"
            defaultValue={searchColumns}
            onChange={getSearchColumns}
            optionLabelProp="label"
            value={searchColumns}
        >    
        {boardColumns.map(function (column, index){
            return (
                <Option value={column.id} label={column.title} key={index}>
                    <div className="demo-option-label-item">
                        {column.title}
                    </div>
                </Option>
            )
        })}
        </Select>
    );
      
    const typeOfSearchMenu = (
        <Select defaultValue="question" style={{ width: '100%' }} onSelect={(value) => {setSearchType(value)}} >
            <Option value="question">Ask Anything</Option>
            <Option value="fuzzy">Fuzzy Search</Option>
            <Option value="keywords">Match Keywords</Option>
        </Select>
    )

    function getSearchColumns(value){
        if(value.length > 1){
            if(value[0] === "All Columns"){
                value.splice(0, 1)
            }
        }
        if(value.length === 0){
            value.push("All Columns")
        }
        setSearchColumns(value)
        // console.log(value)
    }

    function getSearchGroups(value){
        if(value.length > 1){
            if(value[0] === "All Groups"){
                value.splice(0, 1)
            }
        }
        if(value.length === 0){
            value.push("All Groups")
        }
        setSearchGroups(value)
        // console.log(value)
    }

    function clickBackButton(){
        backButton.push('/')
    }

    function getQuestionFromInput(value){

        setQuestion(value)
    }

    async function openItemModal(item){
        // monday.execute
        // console.log("was clicked bahah", id)
        monday.execute('openItemCard', { itemId: item.key });
    }

    async function runSearch(){
        let history = new Set(searchHistory)
        history.add(question)
        let finalHistory = Array.from(history)
        setSearchHistory(finalHistory)
        let resp = await monday.storage.instance.setItem('mop', JSON.stringify(finalHistory))


        if(searchType === "question"){
            setResultsLoading(true)
            if(model){
                let answers = await model.findAnswers(question, wiki)
                setAllResults(answers)
                if(answers.length === 0){
                    monday.execute("notice", { 
                        message: "No results were found...",
                        confirmButton: "Ask Teammates",
                        cancelButton: "Dismiss",
                        excludeCancelButton: false,
                        type: "error", // or "error" (red), or "info" (blue)
                        timeout: 10000,
                     }).then((res) => {
                         if(res.confirm === true){
                             console.log("Send notification to users")
                            // let users = 
                            // monday.api(`
                            //     mutation {
                            //         create_notification(
                            //             text: "I've got a notification for you!" + ${question},
                            //             user_id: ${user_id},
                            //             target_id: ${item_id},
                            //             target_type: Project,
                            //             internal: true
                            //         ) { 
                            //             id 
                            //         }
                            //     }
                            // `);
                         }
                     })
                } else {
                    monday.execute("notice", { 
                        message: "There were " + answers.length + " results found!",
                        type: "success", // or "error" (red), or "info" (blue)
                        timeout: 10000,
                     });
                }
            }
        } else {

            const fuse = (searchType === "fuzzy") ? new Fuse(allData.boards[0].items, fuseOptionsWithFuzzy) : new Fuse(allData.boards[0].items, fuseOptionsWithExact);
            const answers = fuse.search(question)
            let answerDataSource = []

                for(let i = 0; i < answers.length; i++){
                    answerDataSource.push({
                        key: answers[i].item.id,
                        'name': answers[i].item.name
                    })
                }  

                let answerColumns = [
                    {
                        title: 'Item Name',
                        dataIndex: 'name',
                        key: 'name',
                        render: (name, id) => <Button type="link" onClick={async() => await openItemModal(id) }>{name}</Button>
                    },
                ]
                setTableDataSource(answerDataSource)
                setTableDataColumns(answerColumns)
                
                if(answers.length === 0){
                    monday.execute("notice", { 
                        message: "No results were found...",
                        type: "error", // or "error" (red), or "info" (blue)
                        timeout: 10000,
                     });
                } else {
                    monday.execute("notice", { 
                        message: "There were " + answers.length + " results found!",
                        type: "success", // or "error" (red), or "info" (blue)
                        timeout: 10000,
                    });
                }
            }
        }

    useEffect(() => {
        if(isMounted){
            // when results change, update datasource and columns
            let newDatasource = []
            let newResultsColumns = []
            let itemIdsToFetch = new Set()
            let itemIdxMap = itemIdToCorpusIdx // this is the map
            // for()
            // console.log(allResults)
            if(searchType === "question"){
                for(let i = 0; i < allResults.length; i++){
                    newDatasource.push({'Results': allResults[i].text});

                    Object.keys(itemIdxMap).forEach(function(key) {
                        
                        let actualKey = key.split(",")
                        let keyStartIndex = parseInt(actualKey[0])
                        let keyEndIndex = parseInt( actualKey[1])

                        if(allResults[i].startIndex >= keyStartIndex && allResults[i].endIndex <= keyEndIndex){
                            itemIdsToFetch.add(parseInt(itemIdxMap[key]))
                        }
                        
                    });
                    // newDatasource[i]['key'] = i;
                    // if(allResults[i].start)
                }
                if(allResults[0]){
                    // let cols = Object.keys(allResults[0])
                    newResultsColumns.push({
                        title: "Results",
                        dataIndex: "Results",
                        key: "Results"
                    })
                    // for(let j = 0; j <= cols.length; j++){
                    //     newResultsColumns.push({
                    //         title: cols[j],
                    //         dataIndex: cols[j],
                    //         key: cols[j],
                    //     })
                    // }
                }
            } else if(searchType === "fuzzy"){
                
            }
            setDataSource(newDatasource)
            setResultsColumns(newResultsColumns)
            setResultsLoading(false)
            // console.log("IDs that are going to be fetched are: ", itemIdsToFetch)
            fetchFinalItems(itemIdsToFetch)
        }
    }, [allResults])


    async function fetchFinalItems(itemIdsToFetch){
        let arrayItemIdsToFetch = Array.from(itemIdsToFetch)
        monday.api(`query {items(ids:[${arrayItemIdsToFetch}], limit:10000) {id, name}}`)
        .then((res) => {
            if(res.data){
                if(res.data.items.length > 0){
                    let answers = res.data.items
                    // console.log(answers)
                    let answerDataSource = []

                    for(let i = 0; i < answers.length; i++){
                        answerDataSource.push({
                            key: answers[i].id,
                            'name': answers[i].name
                        })
                    }  
    
                    let answerColumns = [
                        {
                            title: 'Item Name',
                            dataIndex: 'name',
                            key: 'name',
                            render: (name, id) => <Button type="link" onClick={async() => await openItemModal(id) }>{name}</Button>
                        },
                    ]
                    setTableDataSource(answerDataSource)
                    setTableDataColumns(answerColumns)
                }
            }
        })
    }

    useEffect(() => {
        if(isMounted){
            // console.log(dataSource)
        }
    }, [dataSource])

    useEffect(() => {
        if(isMounted){
            // console.log(dataSource)
        }
    }, [tableDataSource, tableDataColumns])


    useEffect(() => {
        if(isMounted){
            // console.log(resultsColumns)
        }
    }, [resultsColumns])

    useEffect(() => {
        // getBoardId()
        if(props.location){
            // console.log("This is the question", props.location.state.question)
        }
        monday.listen("context", getContext);
        setDataLoading(true)
        loadModel()
        loadSearchHistory()
        setIsMounted(true)
        setDataLoading(false)
    }, []);

    useEffect(() => {
        if(isMounted){
            setDataLoading(true)
            getBoardGroups()
            getAllData()
            setDataLoading(false)
            // gets triggered whenever boardId changes
            // getBoardColumns() //
            // get other stuff dependent on boardId too!
        }

    }, [boardId])

    useEffect(() => {
        if(isMounted){
            setDataLoading(true)
            createWiki()
            setDataLoading(false)
            // console.log("all board data: ", allData)
        }
    }, [allData])

    useEffect(() => {
        // do nothing
    }, [dataLoading])

    useEffect(() => {
        if(isMounted){
            // add something here?
        }
    }, [itemIdToCorpusIdx])

    useEffect(() => {
        if(isMounted){
            // add something here?
            // console.log(searchHistory)
        }
    }, [searchHistory])

    useEffect(() => {
        if(isMounted){
            // do something here?
        }
    }, [responseView])

    useEffect(() => {
        if(isMounted){
            // do something here?
        }
    }, [searchType])

    useEffect(() => {
        if(isMounted){
            setDataLoading(true)
            createWiki()
            setDataLoading(false)
        }
    }, [searchColumns, searchGroups])

    async function loadModel(){
        const runModel = await qna.load(); // importing the model
        setModel(runModel)
    }

    async function loadSearchHistory(){
        let resp = await monday.storage.instance.getItem('mop')
        if(!resp || !resp.data){
            return
        } else {
            if(resp.data.value !== null){
                let history = resp.data.value;
                setSearchHistory(JSON.parse(history))
            }
        }
        // console.log(history)
        // setSearchHistory(history)
    }

    async function saveSearch(){
        let resp = await monday.storage.instance.getItem('boop')
        let savedItems = []
        if(!resp || !resp.data){
            // create a new object
            // do nothing
            // return
        } else {
            if(resp.data.value !== null){
                savedItems = JSON.parse(resp.data.value);
                savedItems.push(getParamsForSave())
                let postResp = await monday.storage.instance.setItem('boop', JSON.stringify(savedItems))
            } else {
                savedItems.push(getParamsForSave())
                let postResp = await monday.storage.instance.setItem('boop', JSON.stringify(savedItems))
            }
        }
        // console.log(savedItems)
    }

    function getParamsForSave(){
        let params = {'query': question, 'groups': searchGroups, 'columns': searchColumns, 'type': searchType}
        return params;
    }

    async function createWiki(){
        let corpus = ""
        let items = allData.boards[0].items
        // let searchColumnIds = searchColumns.map( item => { return item.id })
        let setSearchColumnIds = new Set(searchColumns)
        let setSearchGroupIds = new Set(searchGroups)
        let itemIdMap = {}
        // console.log(searchColumns)
        // console.log(setSearchColumnIds)
        // let column_ids = set(searchColumns)
        let startIndex = 0
        let endIndex = 0
        for(let i = 0; i < items.length; i++){
            let item = items[i]
            if(setSearchGroupIds.has(item.group.id) || searchGroups[0] === "All Groups"){
                let item_name = items[i].name
                let item_id = items[i].id
                // itemIdMap[item_id] = corpus.length
                // console.log(itemIdMap)
                startIndex = corpus.length
                corpus += "This is the entry for item " + item_name + '.'
                for(let j = 0; j < item.column_values.length; j++){
                    let column = item.column_values[j]
                    let column_type = column.type;
                    let column_text = column.text;
                    let column_id = column.id;
                    // console.log(column_id)
                    if(setSearchColumnIds.has(column_id) || searchColumns[0] === "All Columns"){
                        // This is going to change in a bit
                        if(column_type === "text"){
                            corpus += column_text;
                        }
                        if(column_type === "date"){
                            corpus += ". " + item_name + " is due on " + column_text + "."
                        }
                        if(column_type === "multiple-person"){
                            corpus +=  ". " + item_name + " is assigned to " + column_text + "."
                        }
                        if(column_id === "status"){
                            corpus +=  ". " + item_name + " task item is " + column_text + "."
                        }
                    }
                }
                endIndex = corpus.length - 1
                itemIdMap[[startIndex, endIndex]] = item_id
            }

        }
        setWiki(corpus)
        setItemIdToCorpusIdx(itemIdMap)
    }

    useEffect(() => {
        if(isMounted){
            // do nothing
                    console.log(wiki)

        }
    }, [wiki])

    async function getContext(res){
        setBoardId(res.data.boardIds[0])
    }

    async function getAllData(){
        monday.api(`query {boards(ids:[${boardId}]) {items(limit:10000) {id, name, group {id}, column_values {id, text, type, value, title}}}}`)
        .then((res) => {
            setAllData(res.data)
            // console.log(res.data)
        })
    }

    async function getBoardGroups(){
        monday.api(`query { boards(ids: ${boardId}) { columns { id title } groups { id title }} } `)
        .then((res) => {
            setBoardGroups(res.data.boards[0].groups)
            setBoardColumns(res.data.boards[0].columns)
        })
    }

    function selectResponseView(e){
        if(e.target.value === false){
            setResponseView(false)
        } else {
            setResponseView(true)
        }
    }

    return (
        <div className="container">
            <PageHeader
                className="site-page-header"
                onBack={clickBackButton}
                title="Super Search"
                subTitle="Get answers from your boards!"
            />
            <div className="site-statistic-demo-card">
                { dataLoading ?      
                    <Row gutter={[16, 24]}  justify="center">
                        <LoadingOutlined style={{ fontSize: 48 }} spin />
                    </Row> 
                    :
                    <Row gutter={[16, 24]}>
                        <Col flex="auto">
                            <AutoComplete
                                style={{
                                    width: "100%",
                                    height: "5em"
                                }}
                                onSearch={handleSearch}
                                placeholder="Search for a question, keyword or pattern"
                                shape="round"
                                size="large"
                                suffix={
                                    <SearchOutlined className="site-form-item-icon" />
                                }
                                value={question}
                                onChange={getQuestionFromInput}
                                >
                                {getQAutoComplete.map((email) => (
                                    <Option key={email} value={email}>
                                    {email}
                                    </Option>
                                ))}
                                </AutoComplete>
                        </Col>
                        <Col span={4}>
                            <Button type="primary" size="large" shape="round" block onClick={runSearch}>Search</Button>
                        </Col>
                    </Row>
                }
                    {boardId ?
                    <div className="container">
                     <Row gutter={[16, 24]}>
                        <Col flex="auto">
                            <Collapse defaultActiveKey={['0']} ghost>
                                <Panel header="Advanced Options" key="1">
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <label>Select groups</label>
                                            {groupMenu}
                                        </Col>
                                        <Col span={8}>
                                            <label>Select columns</label>
                                            {columnMenu}
                                        </Col>
                                        <Col span={8}>
                                            <label>Select type of search</label>
                                            {typeOfSearchMenu}
                                        </Col>
                                    </Row>
                                </Panel>
                            </Collapse>
                        </Col>
                        </Row>
                        <Row gutter={ [16, 24]}>
                            <Col flex="auto">
                                <Radio.Group
                                    options={optionsWithDisabled}
                                    onChange={selectResponseView}
                                    value={responseView}
                                    optionType="button"
                                    buttonStyle="solid"
                                />
                            </Col>
                            <Col>
                            <Tooltip placement="topLeft" title="Click to save search parameters">
                                <Button onClick={saveSearch}>Save Search</Button>
                            </Tooltip>
                            </Col>
                        </Row>
                        <Row gutter={[16, 24]}>
                            <Col flex="auto">
                                {
                                    resultsLoading ?                                     
                                        <Table loading dataSource={dataSource} columns={resultsColumns} />
                                    : 
                                        responseView ?
                                            <Table dataSource={dataSource} columns={resultsColumns} />
                                        :
                                            <Table dataSource={tableDataSource} columns={tableDataColumns} />
                                    }
                                
                            </Col>
                        </Row>
                        </div>
                         :  
                         <Row gutter={[16, 24]}>

                         <Col flex="auto">
                         <Empty
                         description={
                           <span>
                             Please select a board to continue...
                           </span>
                         }
                       >
                       </Empty> 
                       </Col>
                       </Row>

                    }
            </div>
        </div>
    )

}

export default SearchView;