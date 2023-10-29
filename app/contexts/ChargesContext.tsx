"use client";

import React, {
    SetStateAction,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Helpers
import { formatPriceToString } from "@/lib/helpers";

// Types
import { InvoiceType, ItemType } from "@/app/types/types";

const defaultChargesContext = {
    discountSwitch: false,
    setDiscountSwitch: (newValue: boolean) => {},
    taxSwitch: false,
    setTaxSwitch: (newValue: boolean) => {},
    shippingSwitch: false,
    setShippingSwitch: (newValue: boolean) => {},
    discountType: "amount",
    setDiscountType: (newValue: SetStateAction<string>) => {},
    taxType: "amount",
    setTaxType: (newValue: SetStateAction<string>) => {},
    shippingType: "amount",
    setShippingType: (newValue: SetStateAction<string>) => {},
    totalInWordsSwitch: true,
    setTotalInWordsSwitch: (newValue: boolean) => {},
    currency: "USD",
    subTotal: 0,
    totalAmount: 0,
    calculateTotal: () => {},
};

export const ChargesContext = createContext(defaultChargesContext);

export const useChargesContext = () => {
    return useContext(ChargesContext);
};

type ChargesContextProps = {
    children: React.ReactNode;
};

export const ChargesContextProvider = ({ children }: ChargesContextProps) => {
    const { control, setValue } = useFormContext<InvoiceType>();

    // Form Fields
    const itemsArray = useWatch({
        name: `details.items`,
        control,
    });

    const currency = useWatch({
        name: `details.currency`,
        control,
    });

    // Charges
    const discount = useWatch({
        name: `details.discountDetails`,
        control,
    });

    const tax = useWatch({
        name: `details.taxDetails`,
        control,
    });

    const shipping = useWatch({
        name: `details.shippingDetails`,
        control,
    });

    // Switch states. On/Off
    const [discountSwitch, setDiscountSwitch] = useState<boolean>(
        discount?.amount ? true : false
    );
    const [taxSwitch, setTaxSwitch] = useState<boolean>(
        tax?.amount ? true : false
    );
    const [shippingSwitch, setShippingSwitch] = useState<boolean>(
        shipping?.cost ? true : false
    );

    // ? Old approach of using totalInWords variable
    // totalInWords ? true : false
    const [totalInWordsSwitch, setTotalInWordsSwitch] = useState<boolean>(true);

    // Initial subtotal and total
    const [subTotal, setSubTotal] = useState<number>(0);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    // Types for discount, tax, and shipping. Amount | Percentage
    const [discountType, setDiscountType] = useState("amount");
    const [taxType, setTaxType] = useState("amount");
    const [shippingType, setShippingType] = useState("amount");

    // When loading if received values, turn on the switches
    useEffect(() => {
        if (discount?.amount) {
            setDiscountSwitch(true);
        }

        if (tax?.amount) {
            setTaxSwitch(true);
        }

        if (shipping?.cost) {
            setShippingSwitch(true);
        }

        if (discount?.amountType == "amount") {
            setDiscountType("amount");
        } else {
            setDiscountType("percentage");
        }

        if (tax?.amountType == "amount") {
            setTaxType("amount");
        } else {
            setTaxType("percentage");
        }

        if (shipping?.costType == "amount") {
            setShippingType("amount");
        } else {
            setShippingType("percentage");
        }
    }, [discount?.amount, tax?.amount, shipping?.cost]);

    // Check switches, if off set values to zero
    useEffect(() => {
        if (!discountSwitch) {
            setValue("details.discountDetails.amount", 0);
        }

        if (!taxSwitch) {
            setValue("details.taxDetails.amount", 0);
        }

        if (!shippingSwitch) {
            setValue("details.shippingDetails.cost", 0);
        }
    }, [discountSwitch, taxSwitch, shippingSwitch]);

    // Calculate total when values change
    useEffect(() => {
        calculateTotal();
    }, [
        itemsArray,
        totalInWordsSwitch,
        discountType,
        discount?.amount,
        taxType,
        tax?.amount,
        shippingType,
        shipping?.cost,
    ]);

    // TODO: Maybe move this and above useEffect logic into a separate hook
    // Calculate total amount in the invoice
    const calculateTotal = () => {
        // Here Number fixes a bug where an extra zero appears
        // at the beginning of subTotal caused by toFixed(2) in item.total in single item
        // Reason: toFixed(2) returns string, not a number instance
        const totalSum: number = itemsArray.reduce(
            (sum: number, item: ItemType) => sum + Number(item.total),
            0
        );

        setValue("details.subTotal", totalSum.toString());
        setSubTotal(totalSum);

        let discountAmount: number =
            parseFloat(discount!.amount.toString()) ?? 0;
        let taxAmount: number = parseFloat(tax!.amount.toString()) ?? 0;
        let shippingCost: number = parseFloat(shipping!.cost.toString()) ?? 0;

        let discountAmountType: string = "amount";
        let taxAmountType: string = "amount";
        let shippingCostType: string = "amount";

        let total: number = totalSum;

        if (discountType == "amount") {
            total -= discountAmount;
            discountAmountType = "amount";
        } else {
            total -= total * (discountAmount / 100);
            discountAmountType = "percentage";
        }

        if (taxType == "amount") {
            total += taxAmount;
            taxAmountType = "amount";
        } else {
            total += total * (taxAmount / 100);
            taxAmountType = "percentage";
        }

        if (shippingType == "amount") {
            total += shippingCost;
            shippingCostType = "amount";
        } else {
            total += total * (shippingCost / 100);
            shippingCostType = "percentage";
        }

        setTotalAmount(total);
        setValue("details.discountDetails.amount", discountAmount);
        setValue("details.taxDetails.amount", taxAmount);
        setValue("details.shippingDetails.cost", shippingCost);

        setValue("details.discountDetails.amountType", discountAmountType);
        setValue("details.taxDetails.amountType", taxAmountType);
        setValue("details.shippingDetails.costType", shippingCostType);

        setValue("details.totalAmount", total.toString());

        if (totalInWordsSwitch) {
            setValue("details.totalAmountInWords", formatPriceToString(total));
        } else {
            setValue("details.totalAmountInWords", "");
        }
    };

    return (
        <ChargesContext.Provider
            value={{
                discountSwitch,
                setDiscountSwitch,
                taxSwitch,
                setTaxSwitch,
                shippingSwitch,
                setShippingSwitch,
                discountType,
                setDiscountType,
                taxType,
                setTaxType,
                shippingType,
                setShippingType,
                totalInWordsSwitch,
                setTotalInWordsSwitch,
                currency,
                subTotal,
                totalAmount,
                calculateTotal,
            }}
        >
            {children}
        </ChargesContext.Provider>
    );
};