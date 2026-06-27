import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const FAB_SIZE = 60;
const INITIAL_X = width - FAB_SIZE - 20;
const INITIAL_Y = height - FAB_SIZE - 120; // タブバー分少し上

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【座標オフセット設計】運転中・右手親指操作対応
//
//  目標: アイコン中心 = 指の (−40, −80) pt の位置に表示
//        → 右手の太い親指がアイコンを隠さない「左上オフセット」
//
//  PIN_OFFSET_X = 40  : 指から左方向 40pt
//  PIN_OFFSET_Y = 80  : 指から上方向 80pt
//
//  【クローン (PinDropFAB)】
//    コンテナ (CLONE_W × CLONE_H) = (60 × 100) pt
//    アイコンはコンテナの左上に配置 → icon center = (20, 20) in container
//    アンカー点 (指の位置) = コンテナ右下 = (60, 100)
//    → コンテナ top-left = (fingerX − 60, fingerY − 100)
//    → icon center screen = (fingerX − 40, fingerY − 80) ✓
//
//  【Marker (MapScreen)】
//    コンテナ (80 × 144) pt [バブル 36pt + gap 8pt + アイコン 40pt + anchor余白]
//    アイコン: absolute top=44, left=0 → icon center = (20, 64) in container
//    アンカー点 = (60, 144) in container
//    Android anchor = { x: 0.75, y: 1.0 }
//    iOS centerOffset = { x: −20, y: −72 }
//    → icon center screen = (coord_x − 40, coord_y − 80) ✓
//
//  【A と B の一致】
//    A (FABドロップ): dropXY = event.absoluteXY (指の位置) → Marker の coord screen = fingerXY
//    B (Markerドラッグ): Android anchor が fingerXY に追従
//    どちらも icon center = (fingerX − 40, fingerY − 80) で完全一致 ✓
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ICON_SIZE = 40;
const PIN_OFFSET_X = 40; // 左方向オフセット (pt)
const PIN_OFFSET_Y = 80; // 上方向オフセット (pt)
// クローンコンテナのサイズ = アイコン半径 + オフセット
// コンテナ右下 (CLONE_W, CLONE_H) = 指の位置に一致させる設計
const CLONE_W = ICON_SIZE / 2 + PIN_OFFSET_X; // = 20 + 40 = 60
const CLONE_H = ICON_SIZE / 2 + PIN_OFFSET_Y; // = 20 + 80 = 100

interface PinDropFABProps {
  onDropPin: (x: number, y: number) => void;
  onActionSelect?: (action: string) => void;
}

export const PinDropFAB: React.FC<PinDropFABProps> = ({ onDropPin, onActionSelect }) => {
  // --- FAB自体の位置 ---
  const translateX = useSharedValue(INITIAL_X);
  const translateY = useSharedValue(INITIAL_Y);
  
  // 移動開始時の位置を記録
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // --- 分身📍の位置と状態 ---
  const isCloning = useSharedValue(false);
  const cloneX = useSharedValue(INITIAL_X);
  const cloneY = useSharedValue(INITIAL_Y);

  // --- メニュー（扇状展開）の状態 ---
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnimation = useSharedValue(0); // 0: 閉, 1: 開

  const toggleMenu = () => {
    const nextState = !menuOpen;
    setMenuOpen(nextState);
    menuAnimation.value = withSpring(nextState ? 1 : 0, { damping: 12, stiffness: 90 });
  };

  const handleAction = (action: string) => {
    toggleMenu();
    if (onActionSelect) onActionSelect(action);
  };

  // 1. FAB自体の移動ジェスチャー（右側のグリップを掴んだ時を想定したパン操作）
  const dragFabGesture = Gesture.Pan()
    .onStart(() => {
      if (menuOpen) runOnJS(toggleMenu)();
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      let finalX = translateX.value;
      let finalY = translateY.value;
      if (finalX < 10) finalX = 10;
      if (finalX > width - FAB_SIZE - 20) finalX = width - FAB_SIZE - 20;
      if (finalY < 50) finalY = 50;
      if (finalY > height - 150) finalY = height - 150;
      
      translateX.value = withSpring(finalX, { damping: 15 });
      translateY.value = withSpring(finalY, { damping: 15 });
    });

  // 2. 分身ドラッグ（長押しして引き出す）ジェスチャー
  //
  // activeOffset: 短いタップ/スワイプは MapView のパンに譲る
  const cloneDragGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .activeOffsetY([-12, 12])
    .onStart((event) => {
      if (menuOpen) runOnJS(toggleMenu)();
      isCloning.value = true;
      cloneX.value = event.absoluteX - CLONE_W;
      cloneY.value = event.absoluteY - CLONE_H;
    })
    .onUpdate((event) => {
      // コンテナ右下 = 指の位置になるよう追従
      cloneX.value = event.absoluteX - CLONE_W;
      cloneY.value = event.absoluteY - CLONE_H;
    })
    .onEnd((event) => {
      isCloning.value = false;
      // 指を離した絶対座標をそのまま渡す。
      // MapScreen の Marker anchor/centerOffset が同じ左上オフセットで描画する。
      const dropX = event.absoluteX;
      const dropY = event.absoluteY;

      cloneX.value = withTiming(translateX.value, { duration: 200 });
      cloneY.value = withTiming(translateY.value, { duration: 200 });

      runOnJS(onDropPin)(dropX, dropY);
    });

  // タップジェスチャー（メニュー展開用）
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(toggleMenu)();
  });

  const longPressCloneGesture = Gesture.Simultaneous(
    Gesture.LongPress().minDuration(250),
    cloneDragGesture
  );

  // --- アニメーションスタイル ---
  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
    };
  });

  const cloneStyle = useAnimatedStyle(() => {
    return {
      opacity: isCloning.value ? 1 : 0,
      transform: [
        { translateX: cloneX.value },
        { translateY: cloneY.value },
      ],
    };
  });

  // 扇状メニューのアイコン用スタイル
  const MENU_TOTAL = 3;
  const MENU_RADIUS = 80;

  const menuItem0Style = useAnimatedStyle(() => {
    const angleStep = (Math.PI / 2) / (MENU_TOTAL - 1);
    const angle = Math.PI - (0 * angleStep);
    const tx = Math.cos(angle) * MENU_RADIUS * menuAnimation.value;
    const ty = -Math.sin(angle) * MENU_RADIUS * menuAnimation.value;
    return {
      position: 'absolute' as const,
      opacity: menuAnimation.value,
      transform: [{ translateX: tx }, { translateY: ty }, { scale: menuAnimation.value }],
    };
  });

  const menuItem1Style = useAnimatedStyle(() => {
    const angleStep = (Math.PI / 2) / (MENU_TOTAL - 1);
    const angle = Math.PI - (1 * angleStep);
    const tx = Math.cos(angle) * MENU_RADIUS * menuAnimation.value;
    const ty = -Math.sin(angle) * MENU_RADIUS * menuAnimation.value;
    return {
      position: 'absolute' as const,
      opacity: menuAnimation.value,
      transform: [{ translateX: tx }, { translateY: ty }, { scale: menuAnimation.value }],
    };
  });

  const menuItem2Style = useAnimatedStyle(() => {
    const angleStep = (Math.PI / 2) / (MENU_TOTAL - 1);
    const angle = Math.PI - (2 * angleStep);
    const tx = Math.cos(angle) * MENU_RADIUS * menuAnimation.value;
    const ty = -Math.sin(angle) * MENU_RADIUS * menuAnimation.value;
    return {
      position: 'absolute' as const,
      opacity: menuAnimation.value,
      transform: [{ translateX: tx }, { translateY: ty }, { scale: menuAnimation.value }],
    };
  });

  return (
    <>
      {/* 分身用のピン（ドラッグ中のみ表示される）
          コンテナ右下 = 指の位置。アイコン center = 指の左40・上80pt に表示。
          MapScreen Marker の anchor/centerOffset と完全一致させることで
          ドロップ前後の視覚的連続性を確保。 */}
      <Animated.View style={[styles.cloneContainer, cloneStyle]} pointerEvents="none">
        <Ionicons name="location" size={ICON_SIZE} color="#F44336" />
      </Animated.View>

      {/* 本体のFABと扇状メニュー全体を一緒に動かす */}
      <Animated.View style={[styles.fabWrapperContainer, fabStyle]} pointerEvents="box-none">
        
        {/* 扇状に展開するメニューアイコン */}
        <Animated.View style={menuItem0Style} pointerEvents={menuOpen ? 'auto' : 'none'}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('mic')} disabled={!menuOpen}>
            <Ionicons name="mic" size={24} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={menuItem1Style} pointerEvents={menuOpen ? 'auto' : 'none'}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('timer')} disabled={!menuOpen}>
            <Ionicons name="timer" size={24} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={menuItem2Style} pointerEvents={menuOpen ? 'auto' : 'none'}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('close')} disabled={!menuOpen}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* 本体のFAB */}
        <View style={styles.fabWrapper}>
          {/* 左側: 分身を引き出す領域（タップでメニュー、長押しで分身ドラッグ） */}
          <GestureDetector gesture={Gesture.Exclusive(longPressCloneGesture, tapGesture)}>
            <View style={styles.fabMain}>
              <Ionicons name="location" size={28} color="#FFFFFF" />
            </View>
          </GestureDetector>

          {/* 右側: FAB自体を移動させるグリップ領域 */}
          <GestureDetector gesture={dragFabGesture}>
            <View style={styles.grip}>
              <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
            </View>
          </GestureDetector>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  fabWrapperContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FAB_SIZE + 24,
    height: FAB_SIZE,
    justifyContent: 'center',
  },
  fabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    height: FAB_SIZE,
    paddingRight: 4,
  },
  fabMain: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grip: {
    height: FAB_SIZE,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  // ドラッグ中クローン用コンテナ
  // サイズ (CLONE_W × CLONE_H) = (60 × 100) pt
  // → コンテナ右下が指の位置と一致 → アイコン center = 指の左40・上80pt
  cloneContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CLONE_W,   // 60pt
    height: CLONE_H,  // 100pt
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    zIndex: 9999,
  },
  menuItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});
