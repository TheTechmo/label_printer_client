declare module 'square-custom' {
    import {CatalogCategory, CatalogObject, Order} from "square";

    export interface ItemCategories {
        [key: string]: CatalogObject<CatalogCategory>
    }

    export interface OrderNotification {
        order: Order
        categories: ItemCategories
    }
}
