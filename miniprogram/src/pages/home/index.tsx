import { Component } from 'react';
import { View, Text } from '@tarojs/components';

class HomePage extends Component {
  componentWillMount() {}

  render() {
    return (
      <View>
        <Text>测试文字1</Text>
        <Text>测试文字2</Text>
        <Text>测试文字3</Text>
      </View>
    );
  }
}

export default HomePage;
