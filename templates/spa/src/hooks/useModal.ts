import { useState, useCallback } from 'react';

/**
 * Manage simple open/close/toggle modal state.
 *
 * @param initialState - Initial open state for the modal.
 * @returns Modal state and stable state-change callbacks.
 * @example
 * const { isOpen, openModal, closeModal } = useModal();
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, openModal, closeModal, toggleModal };
};
