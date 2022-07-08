/*external modules*/
import _ from 'lodash'
import axios from 'axios';
import { Tree, Button } from 'antd';
import React, { useState, useEffect } from 'react';
/*utils*/
import { makeTree } from './utils/makeTree'
/*styles*/
import './App.css';

const API = {
  host: 'http://localhost:8080/microtron',
  async getCategories(tree = false) {
    const { data } = await axios.get(`${this.host}/categories`, { params: { tree }});
    return data;
  },
  async getSavedCategories(tree = false) {
    const { data } = await axios.get(`${this.host}/categories/saved`, { params: { tree }});
    return data;
  },
  async saveCategories(categories, isTree = false) {
    const { data } = await axios.put(`${this.host}/categories/save`, { categories, isTree });
    return data;
  },
  addKeyAndTitle(category) {
    return {
      ...category,
      title: category.name,
      key: category.id
    }
  },
  removeKeyAndTitle(category) {
    return _.omit(category, ['title', 'key'])
  }
}

function App() {
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = useState(false);

  const [checkedKeys, setCheckedKeys] = useState([]);

  const [categories, setCategories] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);

  const onCheck = (checkedKeysValue) => {
    console.log('onCheck', checkedKeysValue);
    setCheckedKeys(checkedKeysValue);
  };

  async function loadCategories(saved = true) {
    setLoading(true);

    try {
      console.log('START -> loadCategories')
      const rawData = saved
        ? await API.getSavedCategories(false)
        : await API.getCategories(false)

      setCategories(rawData);

      const tree = makeTree(rawData, 'parentId', 0, API.addKeyAndTitle)
      setCategoriesTree(tree)

      console.log('END -> loadCategories')
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setLoading(true);

    try {
      const result = await API.saveCategories(categories, false);
      console.log('save result => ', result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false);
    }
  }

  async function loadFromAPI() {
    await loadCategories(false)
  }

  async function loadSaved() {
    await loadCategories(true)
  }

  function removeChecked() {
    const updatedCategories = _.filter(categories, category => !_.includes(checkedKeys, category.id));

    const tree = makeTree(updatedCategories, 'parentId', 0, API.addKeyAndTitle)

    setCategories(updatedCategories);
    setCategoriesTree(tree)

    setCheckedKeys([]);
  }

  useEffect(
    () => {
      loadSaved();
    },
    []
  )

  if (error) return `Error: ${error.message}`;

  return (
    <div className={'App'}>
      <div className={'App-buttons'}>
        <Button type="primary" loading={loading} onClick={save}>
          Save
        </Button>
        <Button type="primary" loading={loading} onClick={loadFromAPI}>
          Load from API
        </Button>
        <Button type="primary" loading={loading} onClick={loadSaved}>
          Load saved
        </Button>
        <Button type="default" onClick={removeChecked}>
          Remove checked
        </Button>
      </div>
      <div className={'App-line'} />
      {
        categories.length
          ? <Tree
            checkable
            autoExpandParent={false}
            onCheck={onCheck}
            checkedKeys={checkedKeys}
            treeData={categoriesTree}
          />
          : <span style={{ color: 'red' }}>No saved categories</span>
      }
    </div>
  );
}

export default App;
