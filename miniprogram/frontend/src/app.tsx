import { PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import './app.scss';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('骆芷蝶智选小程序启动');
  });
  return children;
}

export default App;
