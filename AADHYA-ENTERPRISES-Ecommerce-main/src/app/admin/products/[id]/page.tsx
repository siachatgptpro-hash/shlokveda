import React from 'react';
import { notFound } from 'next/navigation';
import { productRepository } from '@/repositories/product.repository';
import { ProductForm } from '@/components/admin/ProductForm';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0;

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories] = await Promise.all([
    productRepository.findById(params.id),
    productRepository.getAllCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductForm initialProduct={product} categories={categories} />;
}
