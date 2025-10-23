
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  snapshot: QuerySnapshot<DocumentData> | null;
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemoFirebase to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [snapshot, setSnapshot] = useState<QuerySnapshot<DocumentData> | null>(null);

  useEffect(() => {
    // If the query/ref is not ready (null or undefined), do not attempt to listen.
    // Reset state and exit early.
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setSnapshot(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Warn if the query is not memoized, as it can cause performance issues.
    if (!(memoizedTargetRefOrQuery as any).__memo) {
      console.warn('useCollection received a query/ref that was not memoized with useMemoFirebase. This can lead to performance issues and infinite loops.', memoizedTargetRefOrQuery);
    }

    // Set loading state and clear previous errors before starting a new subscription.
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snap: QuerySnapshot<DocumentData>) => {
        setSnapshot(snap);
        const results: ResultItemType[] = snap.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error("useCollection Firestore Error:", err);
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : ((memoizedTargetRefOrQuery as any)._query?.path?.canonicalString() || 'unknown_path');

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setSnapshot(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts
    // or when the query/ref changes.
    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]); // Re-run effect only when the memoized query/ref changes.
  
  return { data, isLoading, error, snapshot };
}

    