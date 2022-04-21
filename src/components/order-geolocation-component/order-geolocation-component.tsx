import { useEffect, useMemo, useState } from 'react';
import { OpenCageProvider } from 'leaflet-geosearch';
import {
  useAppSelector,
  useClickOutside,
  useAppDispatch,
  useGetData,
} from '../../shared/custom-hooks';
import {
  setCityInput,
  setStreetInput,
} from '../../redux/step-one-order-form-slice/step-one-order-form-slice';
import { MapComponent } from '../map-component';
import { TextInput } from '../text-input';
import styles from './order-geolocation-component.module.scss';
import { TCoordinates, TPoints, TPointsData } from '../../shared/types';
import {
  createMapCoordinatesArr,
  filterArrayOfObjects,
} from '../../shared/functions';
import { setStreetsCoordinates } from '../../redux/coordinates-slice/coordinates-slice';

export function OrderGeolocationComponent() {
  const { inputCity: inputCityRedux, inputStreet: inputStreetRedux } =
    useAppSelector(state => state.stepOneOrderForm);
  const streetsCoordinates = useAppSelector(
    state => state.coordinatesSlice.streetsCoordinates,
  );
  const { data } = useGetData<TPointsData[]>({
    QUERY_KEY: 'points',
    url: 'point',
    selectorFunction: (state: TPoints) =>
      state.data.filter(item => item.cityId !== null),
  });
  const [inputCity, setInputCity] = useState(inputCityRedux);
  const [cityArr, setCityArr] = useState<TCoordinates[]>([]);
  const [streetsArr, setStreets] = useState<TCoordinates[]>(streetsCoordinates);
  const [inputStreet, setInputStreet] = useState(inputStreetRedux);
  const [isFirstDropdownOpen, setFirstDropdownOpen] = useState(false);
  const [isSecondDropdownOpen, setSecondDropdownOpen] = useState(false);
  const provider = new OpenCageProvider({
    params: {
      key: `${process.env.REACT_APP_OPEN_CAGE_KEY}`,
      language: 'ru-RU',
      countrycodes: 'ru',
      limit: 1,
    },
  });

  const firstInputRef = useClickOutside<HTMLDivElement>(() => {
    setFirstDropdownOpen(false);
  });
  const secondInputRef = useClickOutside<HTMLDivElement>(() => {
    setSecondDropdownOpen(false);
  });
  const dispatch = useAppDispatch();

  const dispatchInputCity = (value: string) => {
    dispatch(
      setCityInput({
        cityInput: value,
      }),
    );
  };

  const dispatchInputStreet = (value: string) => {
    dispatch(
      setStreetInput({
        streetInput: value,
      }),
    );
  };

  const inputLiClickhandler = (value: string, inputCase: number) => {
    switch (inputCase) {
      case 1:
        dispatchInputCity(value);
        setInputCity(value);
        break;
      case 2:
        dispatchInputStreet(value);
        setInputStreet(value);
    }
  };

  const citiesArr = useMemo(
    () =>
      data
        ?.filter(item => {
          return item.cityId?.name
            .toUpperCase()
            .replace(/\s/g, '')
            .includes(inputCity.toUpperCase().replace(/\s/g, ''));
        })
        .map(item => item.cityId?.name),
    [inputCityRedux, data, isFirstDropdownOpen],
  );

  console.log(streetsArr);

  const addresses = useMemo(
    () =>
      data
        ?.filter(val => {
          return (
            val.cityId?.name === inputCity &&
            val.address
              .toLowerCase()
              .replace(/\s/g, '')
              .includes(inputStreet.toLowerCase().replace(/\s/g, ''))
          );
        })
        .map(value => {
          return value.address;
        }),
    [
      inputStreetRedux,
      isFirstDropdownOpen,
      isSecondDropdownOpen,
      inputCityRedux,
      citiesArr,
      cityArr,
    ],
  );
  useEffect(() => {
    cityArr.length <= 1 &&
      citiesArr?.map(item =>
        createMapCoordinatesArr(item || '', setCityArr, provider),
      );
  }, [inputCityRedux, inputStreetRedux, data]);

  useEffect(() => {
    inputCity &&
      streetsArr.length <= 1 &&
      addresses?.map(item =>
        createMapCoordinatesArr(
          `${item}, ${inputCityRedux}`,
          setStreets,
          provider,
        ),
      );
    dispatch(
      setStreetsCoordinates({
        coordinates: streetsArr,
      }),
    );
  }, [inputCityRedux, inputStreetRedux]);

  const mapClickHandler = (city: string, street?: string) => {
    setInputCity(city);
    dispatchInputCity(city);
    street && setInputStreet(street);
    street && dispatchInputStreet(street);
  };

  const clearInputHandler = (inputCase: number) => {
    switch (inputCase) {
      case 1:
        dispatchInputCity('');
        setInputCity('');
        dispatchInputStreet('');
        setInputStreet('');
        setCityArr([]);
        setStreets([]);
        break;
      case 2:
        dispatchInputStreet('');
        setInputStreet('');
        setStreets([]);
        setCityArr([]);
        break;
    }
  };

  return (
    <section className={styles.container}>
      <form className={styles.form}>
        <TextInput
          title="Город"
          placeholder="Введите город"
          inputValue={inputCity}
          setInputValue={setInputCity}
          listItems={citiesArr}
          isDropDownOpen={isFirstDropdownOpen}
          clearInputHandler={() => clearInputHandler(1)}
          inputClickHandler={() => setFirstDropdownOpen(!isFirstDropdownOpen)}
          referal={firstInputRef}
          onClickLi={(value: string) => inputLiClickhandler(value, 1)}
        />
        <TextInput
          title="Пункт выдачи"
          placeholder="Введите адрес"
          inputValue={inputStreet}
          setInputValue={setInputStreet}
          listItems={addresses}
          isDropDownOpen={isSecondDropdownOpen}
          clearInputHandler={() => clearInputHandler(2)}
          inputClickHandler={() => setSecondDropdownOpen(!isSecondDropdownOpen)}
          referal={secondInputRef}
          onClickLi={(value: string) => inputLiClickhandler(value, 2)}
        />
      </form>
      <div className={styles.map_wrapper}>
        <p className={styles.title}>Выбрать на карте:</p>
        <MapComponent
          zoom={4}
          center={[54.233722, 47.962227]}
          cityTitle={inputCityRedux}
          streetTitle={inputStreetRedux}
          clickHandler={mapClickHandler}
          cityCoordinatesArr={cityArr}
          streetsCoordinatesArr={filterArrayOfObjects(streetsArr)}
        />
      </div>
    </section>
  );
}
