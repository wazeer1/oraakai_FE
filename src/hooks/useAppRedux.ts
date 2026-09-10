import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { AppDispatch, RootState } from '@/app/store'

/** Typed `useDispatch` — prefer this over the plain react-redux hook everywhere. */
export const useAppDispatch: () => AppDispatch = useDispatch

/** Typed `useSelector` — prefer this over the plain react-redux hook everywhere. */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
